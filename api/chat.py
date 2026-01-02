from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

# Try to import dependencies
supabase = None
httpx = None
try:
    from supabase import create_client
    import httpx as httpx_module
    httpx = httpx_module
    
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
except Exception as e:
    print(f"Init error: {e}")

# OpenAI API Configuration - using gpt-4o-mini (cheapest, fastest model)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

SYSTEM_PROMPT = """You are an intelligent financial assistant for Portfolio Copilot.
Respond in English, be concise and use emojis 📊💰📈.
You have access to the user's portfolio data when provided.
Provide relevant analysis based on real data.
Do not give specific financial advice but help understand the portfolio.

CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE:
- Do NOT use ANY markdown formatting at all
- No headers (no #, ##, ###)
- No bold (no ** or __)
- No italic (no * or _)
- Just use plain text with simple dashes (-) for lists
- Write in a natural, conversational way like texting a friend
- Keep it short and casual, not like a formal report"""


def get_user_portfolio(user_id):
    """Fetch user portfolio from Supabase."""
    if not supabase or not user_id:
        return None
    
    try:
        # Get user assets
        assets_response = supabase.table("assets").select("*").eq("user_id", user_id).execute()
        assets = assets_response.data or []
        
        # Get user profile for context
        profile_response = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()
        profile = profile_response.data[0] if profile_response.data else {}
        
        # Calculate portfolio metrics
        total_value = 0
        total_invested = 0
        holdings = []
        
        for asset in assets:
            symbol = asset.get("symbol", "")
            name = asset.get("name", symbol)
            quantity = float(asset.get("amount", 0))
            purchase_price = float(asset.get("purchase_price", 0))
            current_price = float(asset.get("price", purchase_price))
            
            invested = quantity * purchase_price
            value = quantity * current_price
            gain = value - invested
            gain_percent = (gain / invested * 100) if invested > 0 else 0
            
            total_value += value
            total_invested += invested
            
            holdings.append({
                "symbol": symbol,
                "name": name,
                "quantity": quantity,
                "purchase_price": purchase_price,
                "current_price": current_price,
                "value": round(value, 2),
                "invested": round(invested, 2),
                "gain": round(gain, 2),
                "gain_percent": round(gain_percent, 2)
            })
        
        total_gain = total_value - total_invested
        total_gain_percent = (total_gain / total_invested * 100) if total_invested > 0 else 0
        
        return {
            "holdings": holdings,
            "total_value": round(total_value, 2),
            "total_invested": round(total_invested, 2),
            "total_gain": round(total_gain, 2),
            "total_gain_percent": round(total_gain_percent, 2),
            "risk_tolerance": profile.get("risk_tolerance", "unknown"),
            "investment_goals": profile.get("investment_goals", [])
        }
    except Exception as e:
        print(f"Error fetching portfolio: {e}")
        return None


def build_context_prompt(portfolio_data):
    """Build context string from portfolio data for AI."""
    if not portfolio_data or not portfolio_data.get("holdings"):
        return ""
    
    context = "\n\n📊 **USER PORTFOLIO DATA:**\n"
    context += f"- Total Value: ${portfolio_data['total_value']:,.2f}\n"
    context += f"- Total Invested: ${portfolio_data['total_invested']:,.2f}\n"
    context += f"- Gain/Loss: ${portfolio_data['total_gain']:,.2f} ({portfolio_data['total_gain_percent']:.1f}%)\n"
    context += f"- Risk Tolerance: {portfolio_data['risk_tolerance']}\n"
    
    context += "\n📈 **POSITIONS:**\n"
    for h in portfolio_data["holdings"]:
        status = "🟢" if h["gain"] >= 0 else "🔴"
        context += f"- {h['symbol']} ({h['name']}): {h['quantity']} shares @ ${h['current_price']:.2f} | "
        context += f"{status} {h['gain_percent']:+.1f}%\n"
    
    return context


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Health check"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok"}).encode())

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            message = data.get('message', '')
            user_id = data.get('user_id', '')
            
            if not message:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "message required"}).encode())
                return
            
            # Fetch portfolio if user asks about their portfolio
            portfolio_context = ""
            portfolio_keywords = ["portfolio", "analyze", "analysis", "position", "stock", "my", "holdings", "investment"]
            should_fetch_portfolio = any(kw in message.lower() for kw in portfolio_keywords)
            
            if should_fetch_portfolio and user_id:
                portfolio_data = get_user_portfolio(user_id)
                if portfolio_data:
                    portfolio_context = build_context_prompt(portfolio_data)
            
            if not OPENAI_API_KEY or not httpx:
                response_text = "🤖 The AI chatbot requires an OpenAI API key configured in Vercel environment variables (OPENAI_API_KEY)."
            else:
                # Build system prompt with portfolio context
                full_system_prompt = SYSTEM_PROMPT
                if portfolio_context:
                    full_system_prompt += portfolio_context
                
                # Call OpenAI API with gpt-4o-mini
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": full_system_prompt},
                        {"role": "user", "content": message}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 800
                }
                
                headers = {
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                with httpx.Client(timeout=30.0) as client:
                    resp = client.post(OPENAI_URL, json=payload, headers=headers)
                    if resp.status_code == 200:
                        openai_data = resp.json()
                        response_text = openai_data["choices"][0]["message"]["content"].strip()
                    elif resp.status_code == 429:
                        response_text = "⚠️ OpenAI API quota exhausted. Please try again later."
                    elif resp.status_code == 401:
                        response_text = "❌ Invalid OpenAI API key. Please check your configuration."
                    else:
                        response_text = f"OpenAI API Error: {resp.status_code}"
            
            result = {
                "response": response_text,
                "suggestions": ["Analyze my portfolio", "How to diversify?", "Explain ETFs"]
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
