"""
Vercel Serverless Function - Market Data Endpoint
Uses mock data since yfinance is incompatible with serverless environments
"""
import os
import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Mock market data for common symbols
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
    "WMT": {"price": 163.50, "name": "Walmart Inc.", "sector": "Consumer Defensive"},
    "PG": {"price": 158.20, "name": "Procter & Gamble Co.", "sector": "Consumer Defensive"},
    "MA": {"price": 445.60, "name": "Mastercard Inc.", "sector": "Financial"},
    "HD": {"price": 378.90, "name": "The Home Depot Inc.", "sector": "Consumer Cyclical"},
    "DIS": {"price": 112.45, "name": "The Walt Disney Company", "sector": "Communication"},
    "BTC-USD": {"price": 43250.00, "name": "Bitcoin USD", "sector": "Cryptocurrency"},
    "ETH-USD": {"price": 2280.50, "name": "Ethereum USD", "sector": "Cryptocurrency"},
    "SPY": {"price": 475.80, "name": "SPDR S&P 500 ETF", "sector": "ETF"},
    "QQQ": {"price": 405.25, "name": "Invesco QQQ Trust", "sector": "ETF"},
    "VTI": {"price": 245.60, "name": "Vanguard Total Stock Market ETF", "sector": "ETF"},
}


def get_price(symbol: str) -> dict:
    """Get price for a symbol from mock data or return placeholder."""
    symbol = symbol.upper()
    if symbol in MOCK_PRICES:
        return {
            "symbol": symbol,
            "price": MOCK_PRICES[symbol]["price"],
            "name": MOCK_PRICES[symbol]["name"],
            "sector": MOCK_PRICES[symbol]["sector"],
            "source": "cached"
        }
    # Return a placeholder for unknown symbols
    return {
        "symbol": symbol,
        "price": None,
        "name": symbol,
        "sector": "Other",
        "source": "unknown"
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Get price for a symbol via query param: /api/market?symbol=AAPL"""
        self.send_header('Access-Control-Allow-Origin', '*')
        
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            symbol = params.get('symbol', [None])[0]
            
            if not symbol:
                # Return list of available symbols
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                result = {
                    "available_symbols": list(MOCK_PRICES.keys()),
                    "message": "Use ?symbol=AAPL to get price for a specific symbol"
                }
                self.wfile.write(json.dumps(result).encode())
                return
            
            price_data = get_price(symbol)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(price_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_POST(self):
        """Get prices for multiple symbols"""
        self.send_header('Access-Control-Allow-Origin', '*')
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            symbols = data.get('symbols', [])
            
            if not symbols:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "symbols array is required"}).encode())
                return
            
            prices = {}
            for symbol in symbols[:50]:  # Limit to 50 symbols
                price_data = get_price(symbol)
                prices[symbol.upper()] = price_data["price"]
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"prices": prices}).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
