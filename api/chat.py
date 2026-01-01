from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

# Try to import dependencies
supabase = None
httpx = None
try:
    from supabase import create_client
    import httpx as httpx_module
    httpx = httpx_module
    
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
except Exception as e:
    print(f"Init error: {e}")

# OpenAI API Configuration - using gpt-4o-mini (cheapest, fastest model)
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

SYSTEM_PROMPT = """Tu es un assistant financier intelligent pour Portfolio Copilot. 
Réponds en français, sois concis et utilise des emojis 📊💰📈.
Ne donne pas de conseils financiers spécifiques."""


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Health check"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok"}).encode())

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            message = data.get('message', '')
            
            if not message:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "message required"}).encode())
                return
            
            if not OPENAI_API_KEY or not httpx:
                # Return fallback response if OpenAI not configured
                response_text = "🤖 Le chatbot IA nécessite une clé API OpenAI configurée dans les variables d'environnement Vercel (OPENAI_API_KEY)."
            else:
                # Call OpenAI API with gpt-4o-mini (cheapest model)
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": message}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 512
                }
                
                headers = {
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                with httpx.Client(timeout=25.0) as client:
                    resp = client.post(OPENAI_URL, json=payload, headers=headers)
                    if resp.status_code == 200:
                        openai_data = resp.json()
                        response_text = openai_data["choices"][0]["message"]["content"].strip()
                    elif resp.status_code == 429:
                        response_text = "⚠️ Quota OpenAI API épuisé. Veuillez réessayer plus tard."
                    elif resp.status_code == 401:
                        response_text = "❌ Clé API OpenAI invalide. Veuillez vérifier votre configuration."
                    else:
                        response_text = f"Erreur API OpenAI: {resp.status_code}"
            
            result = {
                "response": response_text,
                "suggestions": ["Analyse mon portefeuille", "Comment diversifier?", "Explique les ETF"]
            }
            
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
