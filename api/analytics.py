"""
Vercel Serverless Function - Portfolio Analytics Endpoint
Generates portfolio analysis using Supabase data
"""
import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from supabase import create_client

# Environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Initialize Supabase client
supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Sector mapping for common stocks
SECTOR_MAP = {
    "AAPL": "Technology", "GOOGL": "Technology", "MSFT": "Technology",
    "AMZN": "Consumer Cyclical", "TSLA": "Automotive", "META": "Technology",
    "NVDA": "Technology", "JPM": "Financial", "V": "Financial",
    "JNJ": "Healthcare", "WMT": "Consumer Defensive", "PG": "Consumer Defensive",
    "MA": "Financial", "HD": "Consumer Cyclical", "DIS": "Communication",
    "BTC-USD": "Cryptocurrency", "ETH-USD": "Cryptocurrency",
    "SPY": "ETF", "QQQ": "ETF", "VTI": "ETF",
}


def analyze_portfolio(user_id: str) -> dict:
    """Generate comprehensive portfolio analysis."""
    if not supabase:
        return {"error": "Supabase not configured"}
    
    try:
        # Fetch user's assets
        assets_response = supabase.table("assets").select("*").eq("user_id", user_id).execute()
        
        if not assets_response.data:
            return {"error": "No assets found in portfolio"}
        
        raw_assets = assets_response.data
        
        # Analyze assets
        assets_analysis = []
        sector_map = {}
        total_value = 0
        total_invested = 0
        
        for asset in raw_assets:
            symbol = asset["symbol"].upper()
            amount = float(asset.get("amount", 0))
            purchase_price = float(asset.get("price", 0))
            current_price = purchase_price  # Use purchase price as current (no yfinance)
            
            sector = SECTOR_MAP.get(symbol, "Other")
            
            value = amount * current_price
            cost = amount * purchase_price
            profit_loss = value - cost
            profit_loss_percent = (profit_loss / cost * 100) if cost > 0 else 0
            
            total_value += value
            total_invested += cost
            
            assets_analysis.append({
                "symbol": symbol,
                "name": asset.get("name", symbol),
                "sector": sector,
                "value": round(value, 2),
                "profit_loss": round(profit_loss, 2),
                "profit_loss_percent": round(profit_loss_percent, 2)
            })
            
            if sector not in sector_map:
                sector_map[sector] = {"value": 0, "count": 0}
            sector_map[sector]["value"] += value
            sector_map[sector]["count"] += 1
        
        # Calculate weights
        for asset in assets_analysis:
            asset["weight"] = round((asset["value"] / total_value * 100) if total_value > 0 else 0, 1)
        
        assets_analysis.sort(key=lambda x: x["weight"], reverse=True)
        
        # Sector breakdown
        sectors = []
        for sector, data in sector_map.items():
            weight = (data["value"] / total_value * 100) if total_value > 0 else 0
            sectors.append({
                "sector": sector,
                "weight": round(weight, 1),
                "value": round(data["value"], 2),
                "count": data["count"]
            })
        sectors.sort(key=lambda x: x["weight"], reverse=True)
        
        # Risk metrics
        top_holding_weight = assets_analysis[0]["weight"] if assets_analysis else 0
        
        asset_score = min(len(assets_analysis) * 10, 40)
        sector_score = min(len(sectors) * 15, 30)
        concentration_score = max(0, 30 - top_holding_weight)
        diversification_score = asset_score + sector_score + concentration_score
        
        if top_holding_weight > 50:
            concentration_risk = "High"
        elif top_holding_weight > 30:
            concentration_risk = "Medium"
        else:
            concentration_risk = "Low"
        
        # Recommendations
        recommendations = []
        if len(assets_analysis) < 5:
            recommendations.append("Consider adding more assets for better diversification.")
        if len(sectors) < 3:
            recommendations.append("Your portfolio is concentrated in few sectors.")
        if top_holding_weight > 30:
            recommendations.append(f"Top holding ({assets_analysis[0]['symbol']}) represents {top_holding_weight:.1f}% - consider rebalancing.")
        if not recommendations:
            recommendations.append("Your portfolio looks well-balanced!")
        
        total_gain = total_value - total_invested
        total_gain_percent = (total_gain / total_invested * 100) if total_invested > 0 else 0
        
        return {
            "summary": f"Portfolio of {len(assets_analysis)} assets valued at ${total_value:,.2f}",
            "total_value": round(total_value, 2),
            "total_invested": round(total_invested, 2),
            "total_gain": round(total_gain, 2),
            "total_gain_percent": round(total_gain_percent, 2),
            "assets": assets_analysis,
            "sectors": sectors,
            "risk_metrics": {
                "diversification_score": round(min(diversification_score, 100), 0),
                "concentration_risk": concentration_risk,
                "top_holding_weight": round(top_holding_weight, 1),
                "sector_count": len(sectors),
                "asset_count": len(assets_analysis)
            },
            "recommendations": recommendations
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
        """Get portfolio analysis: /api/analytics?user_id=xxx"""
        self.send_header('Access-Control-Allow-Origin', '*')
        
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            user_id = params.get('user_id', [None])[0]
            
            if not user_id:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "user_id is required"}).encode())
                return
            
            result = analyze_portfolio(user_id)
            
            if "error" in result:
                self.send_response(404 if "No assets" in result.get("error", "") else 500)
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
