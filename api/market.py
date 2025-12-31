from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

# Mock market data
MOCK_PRICES = {
    "AAPL": {"price": 195.50, "name": "Apple Inc.", "sector": "Technology"},
    "GOOGL": {"price": 141.80, "name": "Alphabet Inc.", "sector": "Technology"},
    "MSFT": {"price": 378.90, "name": "Microsoft Corporation", "sector": "Technology"},
    "AMZN": {"price": 178.25, "name": "Amazon.com Inc.", "sector": "Consumer Cyclical"},
    "TSLA": {"price": 248.50, "name": "Tesla Inc.", "sector": "Automotive"},
    "META": {"price": 505.75, "name": "Meta Platforms Inc.", "sector": "Technology"},
    "NVDA": {"price": 495.22, "name": "NVIDIA Corporation", "sector": "Technology"},
    "JPM": {"price": 195.40, "name": "JPMorgan Chase & Co.", "sector": "Financial"},
    "V": {"price": 275.80, "name": "Visa Inc.", "sector": "Financial"},
    "JNJ": {"price": 156.30, "name": "Johnson & Johnson", "sector": "Healthcare"},
    "SPY": {"price": 475.80, "name": "SPDR S&P 500 ETF", "sector": "ETF"},
    "QQQ": {"price": 405.25, "name": "Invesco QQQ Trust", "sector": "ETF"},
}


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            symbol = params.get('symbol', [None])[0]
            
            if symbol:
                symbol = symbol.upper()
                if symbol in MOCK_PRICES:
                    result = {"symbol": symbol, "price": MOCK_PRICES[symbol]["price"]}
                else:
                    result = {"symbol": symbol, "price": None}
            else:
                result = {"available_symbols": list(MOCK_PRICES.keys())}
            
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
            
            symbols = data.get('symbols', [])
            prices = {}
            for sym in symbols[:50]:
                sym = sym.upper()
                if sym in MOCK_PRICES:
                    prices[sym] = MOCK_PRICES[sym]["price"]
                else:
                    prices[sym] = None
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"prices": prices}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
