"""
Vercel Serverless Function - Portfolio Recommendations
Returns asset allocation recommendations based on risk profile
"""
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Risk profile allocations (same as FastAPI backend)
ALLOCATIONS = {
    1: {
        "profile_type": "Conservative",
        "stocks": 20, "bonds": 60, "cash": 20,
        "expected_return": 4.5, "volatility": 6.0,
        "sharpe_ratio": 0.58, "min_horizon_years": 2,
        "explanation": "A conservative portfolio focuses on capital preservation and income.",
        "ai_proposals": [
            {"id": "prop_1", "title": "Add inflation-protected bonds", "description": "Replace 10% of regular bonds with TIPS.", "impact_return": 0.2, "impact_risk": -0.5, "priority": "high", "category": "protection"},
            {"id": "prop_2", "title": "Reduce cash allocation", "description": "Move 5% from cash to high-grade corporate bonds.", "impact_return": 0.4, "impact_risk": 0.3, "priority": "medium", "category": "optimization"}
        ]
    },
    2: {
        "profile_type": "Balanced",
        "stocks": 50, "bonds": 35, "cash": 15,
        "expected_return": 6.5, "volatility": 10.0,
        "sharpe_ratio": 0.52, "min_horizon_years": 5,
        "explanation": "A balanced portfolio combines growth potential with stability.",
        "ai_proposals": [
            {"id": "prop_1", "title": "Diversify internationally", "description": "Add 10% exposure to international developed markets.", "impact_return": 0.5, "impact_risk": 0.2, "priority": "high", "category": "diversification"},
            {"id": "prop_2", "title": "Add real estate exposure", "description": "Include 5% REITs for income and inflation hedge.", "impact_return": 0.7, "impact_risk": 0.5, "priority": "high", "category": "diversification"}
        ]
    },
    3: {
        "profile_type": "Dynamic",
        "stocks": 70, "bonds": 20, "cash": 10,
        "expected_return": 8.0, "volatility": 14.0,
        "sharpe_ratio": 0.47, "min_horizon_years": 7,
        "explanation": "A dynamic portfolio leans towards growth with tolerance for volatility.",
        "ai_proposals": [
            {"id": "prop_1", "title": "Add emerging markets", "description": "Allocate 10% to emerging markets for higher growth.", "impact_return": 1.2, "impact_risk": 2.5, "priority": "high", "category": "growth"},
            {"id": "prop_2", "title": "Include small-cap stocks", "description": "Add 8% exposure to small-cap growth stocks.", "impact_return": 1.0, "impact_risk": 1.8, "priority": "high", "category": "growth"}
        ]
    },
    4: {
        "profile_type": "Aggressive",
        "stocks": 90, "bonds": 5, "cash": 5,
        "expected_return": 10.0, "volatility": 18.0,
        "sharpe_ratio": 0.44, "min_horizon_years": 10,
        "explanation": "An aggressive portfolio maximizes growth through high stock exposure.",
        "ai_proposals": [
            {"id": "prop_1", "title": "Maximum emerging markets", "description": "Increase emerging markets to 20%.", "impact_return": 2.0, "impact_risk": 4.0, "priority": "high", "category": "growth"},
            {"id": "prop_2", "title": "Add cryptocurrency exposure", "description": "Consider 2-5% allocation to Bitcoin/Ethereum.", "impact_return": 3.0, "impact_risk": 8.0, "priority": "medium", "category": "alternative"}
        ]
    }
}


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Get portfolio recommendation: /api/recommendations?profile=2"""
        self.send_header('Access-Control-Allow-Origin', '*')
        
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            profile_str = params.get('profile', [None])[0]
            
            if not profile_str:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "profile parameter required (1-4)"}).encode())
                return
            
            try:
                profile = int(profile_str)
                if profile < 1 or profile > 4:
                    raise ValueError()
            except ValueError:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "profile must be 1, 2, 3, or 4"}).encode())
                return
            
            result = ALLOCATIONS[profile]
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
