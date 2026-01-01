from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

# Try to import httpx for API calls
httpx = None
try:
    import httpx as httpx_module
    httpx = httpx_module
except Exception as e:
    print(f"httpx import error: {e}")


def get_yahoo_price(symbol):
    """Fetch real-time price from Yahoo Finance API."""
    if not httpx:
        return None
    
    try:
        # Use Yahoo Finance v8 API (free, no auth needed)
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                result = data.get("chart", {}).get("result", [])
                if result and len(result) > 0:
                    meta = result[0].get("meta", {})
                    price = meta.get("regularMarketPrice")
                    if price:
                        return round(float(price), 2)
        return None
    except Exception as e:
        print(f"Yahoo API error for {symbol}: {e}")
        return None


def get_multiple_yahoo_prices(symbols):
    """Fetch prices for multiple symbols."""
    prices = {}
    for symbol in symbols[:20]:  # Limit to 20 to avoid rate limits
        symbol = symbol.upper()
        price = get_yahoo_price(symbol)
        prices[symbol] = price
    return prices


# Fallback mock data (only used if Yahoo API fails)
MOCK_PRICES = {
    "AAPL": 250.00,
    "GOOGL": 195.00,
    "MSFT": 430.00,
    "AMZN": 225.00,
    "TSLA": 450.00,
    "META": 610.00,
    "NVDA": 140.00,
    "JPM": 245.00,
    "V": 320.00,
    "JNJ": 145.00,
    "SPY": 600.00,
    "QQQ": 530.00,
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
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            symbol = params.get('symbol', [None])[0]
            
            if symbol:
                symbol = symbol.upper()
                # Try real Yahoo price first
                price = get_yahoo_price(symbol)
                if price is None:
                    # Fallback to mock if available
                    price = MOCK_PRICES.get(symbol)
                
                result = {"symbol": symbol, "price": price, "source": "yahoo" if price else "unavailable"}
            else:
                result = {"available_symbols": list(MOCK_PRICES.keys())}
            
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
            
            symbols = data.get('symbols', [])
            prices = {}
            
            for sym in symbols[:20]:
                sym = sym.upper()
                price = get_yahoo_price(sym)
                if price is None:
                    price = MOCK_PRICES.get(sym)
                prices[sym] = price
            
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
