from http.server import BaseHTTPRequestHandler
import json
import os
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

# Sector mapping
SECTOR_MAP = {
    "AAPL": "Technology", "GOOGL": "Technology", "MSFT": "Technology",
    "AMZN": "Consumer Cyclical", "TSLA": "Automotive", "META": "Technology",
    "NVDA": "Technology", "JPM": "Financial", "V": "Financial",
    "JNJ": "Healthcare", "SPY": "ETF", "QQQ": "ETF",
}


def analyze_portfolio(user_id):
    if not supabase:
        return {"error": "Supabase not configured", "summary": "Analytics unavailable"}
    
    try:
        assets_response = supabase.table("assets").select("*").eq("user_id", user_id).execute()
        assets = assets_response.data or []
        
        if not assets:
            return {"error": "No assets found"}
        
        total_value = 0
        sectors = {}
        assets_analysis = []
        
        for asset in assets:
            symbol = asset.get("symbol", "").upper()
            amount = float(asset.get("amount", 0))
            price = float(asset.get("price", 0))
            value = amount * price
            total_value += value
            
            sector = SECTOR_MAP.get(symbol, "Other")
            if sector not in sectors:
                sectors[sector] = {"value": 0, "count": 0}
            sectors[sector]["value"] += value
            sectors[sector]["count"] += 1
            
            assets_analysis.append({
                "symbol": symbol,
                "name": asset.get("name", symbol),
                "sector": sector,
                "value": round(value, 2),
                "profit_loss": 0,
                "profit_loss_percent": 0
            })
        
        # Calculate weights
        for a in assets_analysis:
            a["weight"] = round((a["value"] / total_value * 100) if total_value > 0 else 0, 1)
        
        sectors_list = [{"sector": k, "weight": round((v["value"]/total_value*100) if total_value > 0 else 0, 1), "value": round(v["value"], 2), "count": v["count"]} for k, v in sectors.items()]
        
        return {
            "summary": f"Portfolio: {len(assets)} assets, ${total_value:,.2f}",
            "total_value": round(total_value, 2),
            "total_invested": round(total_value, 2),
            "total_gain": 0,
            "total_gain_percent": 0,
            "assets": assets_analysis,
            "sectors": sectors_list,
            "risk_metrics": {
                "diversification_score": min(len(assets) * 20, 100),
                "concentration_risk": "Low" if len(assets) >= 5 else "High",
                "top_holding_weight": max([a["weight"] for a in assets_analysis]) if assets_analysis else 0,
                "sector_count": len(sectors),
                "asset_count": len(assets)
            },
            "recommendations": ["Keep diversifying!" if len(assets) >= 5 else "Add more assets for diversification."]
        }
    except Exception as e:
        return {"error": str(e)}


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
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
            
            result = analyze_portfolio(user_id)
            
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
