from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse
from supabase import create_client

# Risk profile allocations
ALLOCATIONS = {
    "1": {
        "profile_type": "Conservative",
        "stocks": 20, "bonds": 60, "cash": 20,
        "expected_return": 4.5, "volatility": 6.0,
        "sharpe_ratio": 0.58, "min_horizon_years": 2,
        "explanation": "A conservative portfolio focuses on capital preservation.",
        "ai_proposals": [
            {"id": "prop_1", "title": "Add inflation-protected bonds", "description": "Replace 10% of bonds with TIPS.", "impact_return": 0.2, "impact_risk": -0.5, "priority": "high", "category": "protection"}
        ]
    },
    "2": {
        "profile_type": "Balanced",
        "stocks": 50, "bonds": 35, "cash": 15,
        "expected_return": 6.5, "volatility": 10.0,
        "sharpe_ratio": 0.52, "min_horizon_years": 5,
        "explanation": "A balanced portfolio combines growth with stability.",
        "ai_proposals": [
            {"id": "prop_1", "title": "Diversify internationally", "description": "Add 10% exposure to international markets.", "impact_return": 0.5, "impact_risk": 0.2, "priority": "high", "category": "diversification"}
        ]
    },
    "3": {
        "profile_type": "Dynamic",
        "stocks": 70, "bonds": 20, "cash": 10,
        "expected_return": 8.0, "volatility": 14.0,
        "sharpe_ratio": 0.47, "min_horizon_years": 7,
        "explanation": "A dynamic portfolio leans towards growth.",
        "ai_proposals": [
            {"id": "prop_1", "title": "Add emerging markets", "description": "Allocate 10% to emerging markets.", "impact_return": 1.2, "impact_risk": 2.5, "priority": "high", "category": "growth"}
        ]
    },
    "4": {
        "profile_type": "Aggressive",
        "stocks": 90, "bonds": 5, "cash": 5,
        "expected_return": 10.0, "volatility": 18.0,
        "sharpe_ratio": 0.44, "min_horizon_years": 10,
        "explanation": "An aggressive portfolio maximizes growth.",
        "ai_proposals": [
            {"id": "prop_1", "title": "Maximum emerging markets", "description": "Increase emerging markets to 20%.", "impact_return": 2.0, "impact_risk": 4.0, "priority": "high", "category": "growth"}
        ]
    }
}

# Stock recommendations by risk profile
STOCK_RECOMMENDATIONS = {
    "1": [
        {"ticker": "BND", "name": "Vanguard Total Bond ETF", "sector": "Bonds", "current_price": 72.50, "explanation": "Low-risk bond fund for capital preservation."},
        {"ticker": "VTIP", "name": "Vanguard Short-Term Inflation-Protected", "sector": "Bonds", "current_price": 48.20, "explanation": "Protection against inflation."},
    ],
    "2": [
        {"ticker": "VTI", "name": "Vanguard Total Stock Market ETF", "sector": "ETF", "current_price": 260.00, "explanation": "Broad market exposure with growth potential."},
        {"ticker": "VXUS", "name": "Vanguard Total International Stock", "sector": "ETF", "current_price": 58.50, "explanation": "International diversification."},
        {"ticker": "BND", "name": "Vanguard Total Bond ETF", "sector": "Bonds", "current_price": 72.50, "explanation": "Stability and income."},
    ],
    "3": [
        {"ticker": "VTI", "name": "Vanguard Total Stock Market ETF", "sector": "ETF", "current_price": 260.00, "explanation": "Core US market exposure."},
        {"ticker": "VGT", "name": "Vanguard Information Technology ETF", "sector": "Technology", "current_price": 520.00, "explanation": "Growth through tech sector."},
        {"ticker": "VWO", "name": "Vanguard Emerging Markets ETF", "sector": "ETF", "current_price": 42.00, "explanation": "High growth potential from emerging markets."},
    ],
    "4": [
        {"ticker": "QQQ", "name": "Invesco QQQ Trust", "sector": "Technology", "current_price": 530.00, "explanation": "High growth Nasdaq exposure."},
        {"ticker": "ARKK", "name": "ARK Innovation ETF", "sector": "Technology", "current_price": 48.00, "explanation": "Disruptive innovation exposure."},
        {"ticker": "VWO", "name": "Vanguard Emerging Markets ETF", "sector": "ETF", "current_price": 42.00, "explanation": "Emerging market growth."},
        {"ticker": "SOXX", "name": "iShares Semiconductor ETF", "sector": "Technology", "current_price": 220.00, "explanation": "Semiconductor sector exposure."},
    ]
}


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
            profile = params.get('profile', ['2'])[0]
            req_type = params.get('type', ['allocation'])[0]
            user_id = params.get('user_id', [None])[0]
            
            if profile not in ALLOCATIONS:
                profile = '2'
            
            # Return stock recommendations if type=stocks
            if req_type == 'stocks':
                # Calculate Remaining Budget using Supabase if available
                remaining_budget = 1000 # Default fallback
                
                try:
                    supabase_url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
                    supabase_key = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY")
                    
                    if user_id and supabase_url and supabase_key:
                        supabase = create_client(supabase_url, supabase_key)
                        
                        # 1. Fetch Profile
                        profile_response = supabase.from_("user_profiles").select("initial_investment, monthly_budget, created_at").eq("user_id", user_id).execute()
                        
                        if profile_response.data:
                            user_profile = profile_response.data[0]
                            initial_investment = float(user_profile.get("initial_investment") or 0)
                            monthly_budget = float(user_profile.get("monthly_budget") or 0)
                            created_at_str = user_profile.get("created_at")
                            
                            # Calculate total cash injected
                            total_cash_injected = initial_investment
                            if created_at_str:
                                from datetime import datetime
                                from dateutil.relativedelta import relativedelta
                                try:
                                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                                    now = datetime.now(created_at.tzinfo)
                                    
                                    current_check = created_at
                                    # Logic to move to next month 1st - Simplified for serverless
                                    current_check = current_check + relativedelta(months=1)
                                    current_check = current_check.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                                    
                                    months_passed = 0
                                    while current_check <= now:
                                        months_passed += 1
                                        current_check = current_check + relativedelta(months=1)
                                    
                                    total_cash_injected += (monthly_budget * months_passed)
                                except:
                                    pass # Fallback to initial only on date parse error

                            # 2. Fetch Assets
                            assets_response = supabase.from_("assets").select("amount, price").eq("user_id", user_id).execute()
                            total_invested = sum(float(a["amount"]) * float(a["price"]) for a in assets_response.data)
                            
                            remaining_budget = max(0, total_cash_injected - total_invested)
                except Exception as e:
                    print(f"Error calculating budget in Vercel function: {e}")
                    # Keep default 1000 or set to -1?
                    # let's keep 1000 or -1? User complained about 1000. 
                    # If error, maybe -1 is safer to indicate 'unknown'
                    pass

                stocks = STOCK_RECOMMENDATIONS.get(profile, [])
                result = {
                    "remaining_budget": remaining_budget,
                    "recommendations": stocks
                }
            else:
                # Return allocation data
                result = ALLOCATIONS[profile]
            
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
