"""
Vercel Serverless Function - Portfolio Endpoints
Handles transactions, history, and close position
"""
import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
from supabase import create_client

# Environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Initialize Supabase client
supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_portfolio_history(user_id: str) -> dict:
    """Get portfolio value history over time."""
    if not supabase:
        return {"error": "Supabase not configured"}
    
    try:
        # Get user profile
        profile_response = supabase.table("user_profiles").select(
            "initial_investment, monthly_budget, created_at"
        ).eq("user_id", user_id).execute()
        
        initial_investment = 0.0
        monthly_budget = 0.0
        
        if profile_response.data:
            profile = profile_response.data[0]
            initial_investment = float(profile.get("initial_investment") or 0)
            monthly_budget = float(profile.get("monthly_budget") or 0)
        
        # Get current assets
        assets_response = supabase.table("assets").select("*").eq("user_id", user_id).execute()
        current_assets = assets_response.data or []
        
        # Calculate current portfolio value
        current_value = sum(float(a.get("amount", 0)) * float(a.get("price", 0)) for a in current_assets)
        
        # Get transactions for realized gains
        tx_response = supabase.table("transactions").select("profit_loss").eq("user_id", user_id).execute()
        realized_gains = sum(float(tx.get("profit_loss") or 0) for tx in (tx_response.data or []))
        
        # Build simple 6-month history
        history = []
        now = datetime.now()
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        for i in range(5, -1, -1):
            month_idx = (now.month - 1 - i) % 12
            month_name = months[month_idx]
            
            # Simple linear interpolation for demo
            progress = (5 - i) / 5
            invested_at_month = initial_investment + (monthly_budget * (5 - i))
            value_at_month = invested_at_month * (1 + 0.05 * progress)  # ~5% growth estimate
            
            if i == 0:
                value_at_month = current_value if current_value > 0 else invested_at_month
            
            history.append({
                "month": month_name,
                "value": round(value_at_month, 2),
                "invested": round(invested_at_month, 2),
                "gain": round(value_at_month - invested_at_month, 2)
            })
        
        total_invested = initial_investment + (monthly_budget * 6)
        total_gain = (current_value + realized_gains) - total_invested
        total_gain_percent = (total_gain / total_invested * 100) if total_invested > 0 else 0
        
        return {
            "history": history,
            "current_value": round(current_value, 2),
            "total_invested": round(total_invested, 2),
            "total_gain": round(total_gain, 2),
            "total_gain_percent": round(total_gain_percent, 2)
        }
        
    except Exception as e:
        print(f"Error in get_portfolio_history: {e}")
        return {"error": str(e)}


def get_transactions(user_id: str) -> dict:
    """Get all transactions for a user."""
    if not supabase:
        return {"transactions": [], "total_realized_gains": 0, "total_transactions": 0}
    
    try:
        response = supabase.table("transactions").select("*").eq("user_id", user_id).execute()
        
        transactions = []
        total_realized_gains = 0.0
        
        for tx in (response.data or []):
            profit_loss = float(tx.get("profit_loss") or 0)
            total_realized_gains += profit_loss
            
            transactions.append({
                "id": tx.get("id"),
                "symbol": tx.get("symbol"),
                "name": tx.get("name"),
                "type": tx.get("type"),
                "quantity": float(tx.get("quantity") or 0),
                "purchase_price": float(tx.get("purchase_price") or 0),
                "sale_price": float(tx.get("sale_price") or 0),
                "profit_loss": profit_loss,
                "profit_loss_percent": float(tx.get("profit_loss_percent") or 0),
                "purchase_date": tx.get("purchase_date"),
                "sale_date": tx.get("sale_date")
            })
        
        return {
            "transactions": transactions,
            "total_realized_gains": round(total_realized_gains, 2),
            "total_transactions": len(transactions)
        }
        
    except Exception as e:
        print(f"Error fetching transactions: {e}")
        return {"transactions": [], "total_realized_gains": 0, "total_transactions": 0}


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests for portfolio endpoints"""
        self.send_header('Access-Control-Allow-Origin', '*')
        
        try:
            parsed = urlparse(self.path)
            path = parsed.path
            params = parse_qs(parsed.query)
            
            user_id = params.get('user_id', [None])[0]
            
            if not user_id:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "user_id is required"}).encode())
                return
            
            # Route based on path
            if 'history' in path:
                result = get_portfolio_history(user_id)
            elif 'transactions' in path:
                result = get_transactions(user_id)
            else:
                # Default to history
                result = get_portfolio_history(user_id)
            
            if "error" in result and result["error"] != "Supabase not configured":
                self.send_response(500)
            else:
                self.send_response(200)
            
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_POST(self):
        """Handle POST for closing positions (not implemented in serverless)"""
        self.send_response(501)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({
            "error": "Close position not available in serverless mode. Use local backend."
        }).encode())
