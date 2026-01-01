from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import parse_qs, urlparse

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
            
            if profile not in ALLOCATIONS:
                profile = '2'
            
            # Return stock recommendations if type=stocks
            if req_type == 'stocks':
                stocks = STOCK_RECOMMENDATIONS.get(profile, [])
                result = {
                    "remaining_budget": 1000,
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
