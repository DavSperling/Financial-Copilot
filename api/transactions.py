from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime
from urllib.parse import parse_qs, urlparse

# Try to import supabase
supabase = None
try:
    from supabase import create_client
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
except Exception as e:
    print(f"Supabase init error: {e}")


def get_transactions(user_id):
    """Get closed position transactions for user."""
    if not supabase:
        return {
            "transactions": [],
            "total_realized_gains": 0,
            "total_transactions": 0
        }
    
    try:
        # Get transactions from transactions table
        response = supabase.table("transactions").select("*").eq("user_id", user_id).order("sale_date", desc=True).execute()
        transactions = response.data or []
        
        total_gains = sum(float(t.get("profit_loss", 0)) for t in transactions)
        
        return {
            "transactions": transactions,
            "total_realized_gains": round(total_gains, 2),
            "total_transactions": len(transactions)
        }
    except Exception as e:
        # Table might not exist, return empty
        print(f"Transactions error: {e}")
        return {
            "transactions": [],
            "total_realized_gains": 0,
            "total_transactions": 0
        }


def close_position(data):
    """Close a position and record as transaction."""
    if not supabase:
        return {"error": "Supabase not configured", "success": False}
    
    try:
        user_id = data.get("user_id")
        asset_id = data.get("asset_id")
        sale_price = float(data.get("sale_price", 0))
        
        if not user_id or not asset_id:
            return {"error": "user_id and asset_id are required", "success": False}
        
        # Get the asset
        asset_response = supabase.table("assets").select("*").eq("id", asset_id).eq("user_id", user_id).single().execute()
        
        if not asset_response.data:
            return {"error": "Asset not found", "success": False}
        
        asset = asset_response.data
        quantity = float(asset.get("amount", 0))
        purchase_price = float(asset.get("price", 0))
        
        total_cost = quantity * purchase_price
        total_revenue = quantity * sale_price
        profit_loss = total_revenue - total_cost
        profit_loss_percent = (profit_loss / total_cost * 100) if total_cost > 0 else 0
        
        # Create transaction record
        transaction_data = {
            "user_id": user_id,
            "symbol": asset.get("symbol"),
            "name": asset.get("name"),
            "type": asset.get("type"),
            "quantity": quantity,
            "purchase_price": purchase_price,
            "sale_price": sale_price,
            "purchase_date": asset.get("created_at"),
            "sale_date": datetime.now().isoformat(),
            "total_cost": round(total_cost, 2),
            "total_revenue": round(total_revenue, 2),
            "profit_loss": round(profit_loss, 2),
            "profit_loss_percent": round(profit_loss_percent, 2)
        }
        
        print(f"[CLOSE] Inserting transaction: {transaction_data}")
        
        # Insert transaction - this MUST succeed before we delete the asset
        tx_response = supabase.table("transactions").insert(transaction_data).execute()
        
        if not tx_response.data:
            print(f"[CLOSE] Transaction insert returned no data!")
            return {"error": "Failed to save transaction", "success": False}
        
        print(f"[CLOSE] Transaction saved: {tx_response.data}")
        
        # Only delete the asset AFTER transaction is saved successfully
        supabase.table("assets").delete().eq("id", asset_id).execute()
        print(f"[CLOSE] Asset {asset_id} deleted")
        
        return {
            "success": True,
            "message": "Position closed successfully",
            "profit_loss": round(profit_loss, 2),
            "profit_loss_percent": round(profit_loss_percent, 2),
            "transaction": tx_response.data[0]
        }
        
    except Exception as e:
        print(f"Error closing position: {e}")
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
            
            result = get_transactions(user_id)
            
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
            
            action = data.get("action", "close")
            
            if action == "close":
                result = close_position(data)
            else:
                result = {"error": "Unknown action", "success": False}
            
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
