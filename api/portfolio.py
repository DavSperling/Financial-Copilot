from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

# Try to import supabase, but gracefully handle if not available
supabase = None
try:
    from supabase import create_client
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
except Exception as e:
    print(f"Supabase init error: {e}")


def get_portfolio_history(user_id):
    """Get portfolio history for user."""
    if not supabase:
        # Return mock data if Supabase not configured
        return {
            "history": [
                {"month": "Jul", "value": 1000, "invested": 1000, "gain": 0},
                {"month": "Aug", "value": 1050, "invested": 1100, "gain": -50},
                {"month": "Sep", "value": 1200, "invested": 1200, "gain": 0},
                {"month": "Oct", "value": 1350, "invested": 1300, "gain": 50},
                {"month": "Nov", "value": 1500, "invested": 1400, "gain": 100},
                {"month": "Dec", "value": 1650, "invested": 1500, "gain": 150}
            ],
            "current_value": 1650,
            "total_invested": 1500,
            "total_gain": 150,
            "total_gain_percent": 10.0
        }
    
    try:
        # Get assets
        assets_response = supabase.table("assets").select("*").eq("user_id", user_id).execute()
        assets = assets_response.data or []
        
        current_value = sum(float(a.get("amount", 0)) * float(a.get("price", 0)) for a in assets)
        
        # Get profile
        profile_response = supabase.table("user_profiles").select("initial_investment, monthly_budget").eq("user_id", user_id).execute()
        profile = profile_response.data[0] if profile_response.data else {}
        
        initial = float(profile.get("initial_investment") or 0)
        monthly = float(profile.get("monthly_budget") or 0)
        
        # Simple history
        months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        history = []
        for i, m in enumerate(months):
            invested = initial + (monthly * i)
            value = invested * (1 + 0.02 * i)  # Simple growth estimate
            if i == 5:  # Current month
                value = current_value if current_value > 0 else invested
            history.append({
                "month": m,
                "value": round(value, 2),
                "invested": round(invested, 2),
                "gain": round(value - invested, 2)
            })
        
        total_invested = initial + (monthly * 5)
        total_gain = current_value - total_invested
        
        return {
            "history": history,
            "current_value": round(current_value, 2),
            "total_invested": round(total_invested, 2),
            "total_gain": round(total_gain, 2),
            "total_gain_percent": round((total_gain / total_invested * 100) if total_invested > 0 else 0, 2)
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}


def add_asset(data):
    """Add a new asset to user's portfolio."""
    if not supabase:
        return {"error": "Supabase not configured", "success": False}
    
    try:
        user_id = data.get("user_id")
        ticker = data.get("ticker", "").upper()
        name = data.get("name", ticker)
        price = float(data.get("price", 0))
        amount = float(data.get("amount", 1))
        asset_type = data.get("type", "stock")
        
        if not user_id or not ticker:
            return {"error": "user_id and ticker are required", "success": False}
        
        # Insert into assets table (matching schema: symbol, name, type, amount, price)
        # type must be one of: 'Stock', 'Crypto', 'ETF', 'Bond'
        valid_types = {'stock': 'Stock', 'crypto': 'Crypto', 'etf': 'ETF', 'bond': 'Bond'}
        normalized_type = valid_types.get(asset_type.lower(), 'Stock')
        
        asset_data = {
            "user_id": user_id,
            "symbol": ticker,
            "name": name,
            "price": price,
            "amount": amount,
            "type": normalized_type
        }
        
        result = supabase.table("assets").insert(asset_data).execute()
        
        if result.data:
            return {"success": True, "asset": result.data[0]}
        else:
            return {"error": "Failed to insert asset", "success": False}
            
    except Exception as e:
        print(f"Error adding asset: {e}")
        return {"error": str(e), "success": False}


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            user_id = params.get('user_id', [None])[0]
            
            if not user_id:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "user_id required"}).encode())
                return
            
            result = get_portfolio_history(user_id)
            
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

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            result = add_asset(data)
            
            status = 200 if result.get("success") else 400
            
            self.send_response(status)
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
