from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import parse_qs, urlparse
import math


def generate_investment_chart(initial_amount, monthly_contribution, years, annual_return):
    """Generate investment projection chart data."""
    try:
        initial = float(initial_amount) if initial_amount else 1000
        monthly = float(monthly_contribution) if monthly_contribution else 100
        yrs = int(years) if years else 10
        rate = float(annual_return) if annual_return else 7.0
        
        monthly_rate = rate / 100 / 12
        data_points = []
        
        balance = initial
        total_invested = initial
        
        for month in range(yrs * 12 + 1):
            if month > 0:
                balance = balance * (1 + monthly_rate) + monthly
                total_invested += monthly
            
            if month % 12 == 0:  # Only add yearly data points
                year = month // 12
                data_points.append({
                    "year": year,
                    "balance": round(balance, 2),
                    "invested": round(total_invested, 2),
                    "gains": round(balance - total_invested, 2)
                })
        
        final_balance = data_points[-1]["balance"] if data_points else initial
        total_gains = final_balance - total_invested
        
        return {
            "chart_data": data_points,
            "summary": {
                "initial_investment": initial,
                "monthly_contribution": monthly,
                "years": yrs,
                "annual_return": rate,
                "final_balance": round(final_balance, 2),
                "total_invested": round(total_invested, 2),
                "total_gains": round(total_gains, 2),
                "total_return_percent": round((total_gains / total_invested * 100) if total_invested > 0 else 0, 2)
            }
        }
    except Exception as e:
        return {"error": str(e)}


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
            
            initial = params.get('initial', [1000])[0]
            monthly = params.get('monthly', [100])[0]
            years = params.get('years', [10])[0]
            rate = params.get('rate', [7])[0]
            
            result = generate_investment_chart(initial, monthly, years, rate)
            
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
            
            result = generate_investment_chart(
                data.get('initial_amount'),
                data.get('monthly_contribution'),
                data.get('years'),
                data.get('annual_return')
            )
            
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
