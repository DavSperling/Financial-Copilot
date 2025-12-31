"""
Vercel Serverless Function - Chat Endpoint
Uses Gemini API for AI responses with portfolio context from Supabase
"""
import os
import json
from http.server import BaseHTTPRequestHandler
import httpx
from supabase import create_client

# Environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

# Initialize Supabase client
supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

SYSTEM_PROMPT = """Tu es un assistant financier intelligent et amical pour l'application "Portfolio Copilot". 
Tu aides les utilisateurs à comprendre leurs investissements et à prendre de meilleures décisions financières.

RÈGLES IMPORTANTES:
1. Réponds toujours en français sauf si l'utilisateur parle une autre langue
2. Sois concis mais informatif
3. Utilise des emojis pour rendre tes réponses plus engageantes 📊💰📈
4. Si tu ne connais pas une information, dis-le honnêtement
5. Ne donne JAMAIS de conseils financiers spécifiques comme "achète cette action"
6. Rappelle que tu es un assistant et non un conseiller financier agréé
7. Tu as accès aux données du portefeuille de l'utilisateur pour répondre à ses questions
"""


def get_portfolio_context(user_id: str) -> str:
    """Fetch user's portfolio data to provide context to the chatbot."""
    if not supabase:
        return "Portfolio data unavailable (Supabase not configured)."
    
    try:
        # Get user profile
        profile_response = supabase.table("user_profiles").select(
            "initial_investment, monthly_budget"
        ).eq("user_id", user_id).execute()
        
        profile = profile_response.data[0] if profile_response.data else {}
        
        # Get assets
        assets_response = supabase.table("assets").select("*").eq("user_id", user_id).execute()
        assets = assets_response.data or []
        
        # Build context string
        context = f"""
USER PORTFOLIO INFORMATION:
- Initial Investment: ${profile.get('initial_investment', 'Unknown')}
- Monthly Budget: ${profile.get('monthly_budget', 'Unknown')}

CURRENT HOLDINGS ({len(assets)} assets):
"""
        total_value = 0
        for asset in assets:
            qty = float(asset.get('amount', 0))
            price = float(asset.get('price', 0))
            value = qty * price
            total_value += value
            context += f"- {asset.get('symbol')}: {qty} units at ${price:.2f} (Value: ${value:.2f})\n"
        
        context += f"""
PORTFOLIO SUMMARY:
- Total Value: ${total_value:.2f}
- Number of Positions: {len(assets)}
"""
        return context
    except Exception as e:
        print(f"Error getting portfolio context: {e}")
        return "Portfolio data unavailable."


def generate_suggestions(user_message: str) -> list:
    """Generate contextual follow-up suggestions."""
    message_lower = user_message.lower()
    
    if any(word in message_lower for word in ['portfolio', 'portefeuille', 'performance']):
        return [
            "Comment améliorer ma diversification ?",
            "Quel est mon risque de concentration ?",
            "Montre-moi mes gains réalisés"
        ]
    elif any(word in message_lower for word in ['etf', 'action', 'stock', 'investir']):
        return [
            "C'est quoi la différence entre ETF et action ?",
            "Comment choisir un bon ETF ?",
            "Quels secteurs sont intéressants ?"
        ]
    else:
        return [
            "Analyse mon portefeuille",
            "Comment diversifier mes investissements ?",
            "Explique-moi les bases de l'investissement"
        ]


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Health check endpoint"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {"status": "ok", "service": "chat"}
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        """Handle chat messages"""
        self.send_header('Access-Control-Allow-Origin', '*')
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            user_id = data.get('user_id', '')
            message = data.get('message', '')
            history = data.get('history', [])
            
            if not message:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Message is required"}).encode())
                return
            
            # Get portfolio context
            portfolio_context = get_portfolio_context(user_id)
            
            # Build prompt
            full_prompt = f"{SYSTEM_PROMPT}\n\n{portfolio_context}\n\n"
            for msg in history[-10:]:
                role_label = "Utilisateur" if msg.get('role') == "user" else "Assistant"
                full_prompt += f"{role_label}: {msg.get('content', '')}\n"
            full_prompt += f"Utilisateur: {message}\nAssistant:"
            
            # Call Gemini API
            payload = {
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024}
            }
            
            with httpx.Client(timeout=25.0) as client:
                response = client.post(GEMINI_URL, json=payload)
                
                if response.status_code != 200:
                    raise Exception(f"Gemini API error: {response.text}")
                
                gemini_data = response.json()
            
            ai_response = gemini_data["candidates"][0]["content"]["parts"][0]["text"].strip()
            suggestions = generate_suggestions(message)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            result = {"response": ai_response, "suggestions": suggestions}
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            print(f"Error in chat: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
