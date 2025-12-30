from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import httpx
from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

router = APIRouter(
    prefix="/chat",
    tags=["AI Chatbot"]
)

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    user_id: str
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str]

def get_portfolio_context(user_id: str) -> str:
    """Fetch user's portfolio data to provide context to the chatbot."""
    try:
        # Get user profile (without risk_level which doesn't exist)
        profile_response = supabase_admin.table("user_profiles").select(
            "initial_investment, monthly_budget"
        ).eq("user_id", user_id).execute()
        
        profile = profile_response.data[0] if profile_response.data else {}
        
        # Get assets
        assets_response = supabase_admin.table("assets").select("*").eq("user_id", user_id).execute()
        assets = assets_response.data or []
        
        # Get transactions
        tx_response = supabase_admin.table("transactions").select("*").eq("user_id", user_id).execute()
        transactions = tx_response.data or []
        
        # Build context string
        context = f"""
USER PORTFOLIO INFORMATION:
- Initial Investment: ${profile.get('initial_investment', 'Unknown')}
- Monthly Budget: ${profile.get('monthly_budget', 'Unknown')}

CURRENT HOLDINGS ({len(assets)} assets):
"""
        total_value = 0
        for asset in assets:
            qty = float(asset.get('amount', 0))
            price = float(asset.get('price', 0))
            value = qty * price
            total_value += value
            context += f"- {asset.get('symbol')}: {qty} units at ${price:.2f} (Value: ${value:.2f})\n"
        
        context += f"""
PORTFOLIO SUMMARY:
- Total Value: ${total_value:.2f}
- Number of Positions: {len(assets)}
- Closed Transactions: {len(transactions)}
"""
        
        if transactions:
            total_realized = sum(float(tx.get('profit_loss', 0)) for tx in transactions)
            context += f"- Total Realized Gains/Losses: ${total_realized:.2f}\n"
        
        return context
    except Exception as e:
        print(f"Error getting portfolio context: {e}")
        return "Portfolio data unavailable."

SYSTEM_PROMPT = """Tu es un assistant financier intelligent et amical pour l'application "Portfolio Copilot". 
Tu aides les utilisateurs à comprendre leurs investissements et à prendre de meilleures décisions financières.

RÈGLES IMPORTANTES:
1. Réponds toujours en français sauf si l'utilisateur parle une autre langue
2. Sois concis mais informatif
3. Utilise des emojis pour rendre tes réponses plus engageantes 📊💰📈
4. Si tu ne connais pas une information, dis-le honnêtement
5. Ne donne JAMAIS de conseils financiers spécifiques comme "achète cette action"
6. Rappelle que tu es un assistant et non un conseiller financier agréé
7. Tu as accès aux données du portefeuille de l'utilisateur pour répondre à ses questions

EXEMPLES DE QUESTIONS QUE TU PEUX AIDER:
- Analyser la performance du portefeuille
- Expliquer des concepts financiers (ETF, diversification, etc.)
- Suggérer des stratégies générales basées sur le profil de risque
- Répondre aux questions sur l'utilisation de l'application
"""

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message to the AI chatbot and get a response.
    The chatbot has access to the user's portfolio data for personalized responses.
    """
    try:
        # Get portfolio context
        portfolio_context = get_portfolio_context(request.user_id)
        
        # Build conversation history for Gemini
        full_prompt = f"{SYSTEM_PROMPT}\n\n{portfolio_context}\n\n"
        
        # Add conversation history
        for msg in request.history[-10:]:  # Last 10 messages for context
            role_label = "Utilisateur" if msg.role == "user" else "Assistant"
            full_prompt += f"{role_label}: {msg.content}\n"
        
        # Add current message
        full_prompt += f"Utilisateur: {request.message}\nAssistant:"
        
        # Call Gemini API directly via REST
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": full_prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(GEMINI_URL, json=payload)
            
            if response.status_code != 200:
                error_data = response.json()
                error_msg = error_data.get("error", {}).get("message", "Unknown error")
                raise Exception(f"Gemini API error: {error_msg}")
            
            data = response.json()
            
        # Extract response text
        ai_response = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        # Generate contextual suggestions based on the conversation
        suggestions = generate_suggestions(request.message)
        
        return ChatResponse(
            response=ai_response,
            suggestions=suggestions
        )
        
    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Erreur lors de la communication avec l'IA: {str(e)}"
        )

def generate_suggestions(user_message: str) -> List[str]:
    """Generate contextual follow-up suggestions based on the conversation."""
    message_lower = user_message.lower()
    
    if any(word in message_lower for word in ['portfolio', 'portefeuille', 'performance']):
        return [
            "Comment améliorer ma diversification ?",
            "Quel est mon risque de concentration ?",
            "Montre-moi mes gains réalisés"
        ]
    elif any(word in message_lower for word in ['etf', 'action', 'stock', 'investir']):
        return [
            "C'est quoi la différence entre ETF et action ?",
            "Comment choisir un bon ETF ?",
            "Quels secteurs sont intéressants ?"
        ]
    elif any(word in message_lower for word in ['risque', 'risk', 'danger']):
        return [
            "Comment réduire le risque ?",
            "C'est quoi la diversification ?",
            "Quel est mon profil de risque ?"
        ]
    elif any(word in message_lower for word in ['vendre', 'sell', 'quitter']):
        return [
            "Quand faut-il vendre ?",
            "Comment calculer mes plus-values ?",
            "Qu'est-ce qu'un ordre stop-loss ?"
        ]
    else:
        return [
            "Analyse mon portefeuille",
            "Comment diversifier mes investissements ?",
            "Explique-moi les bases de l'investissement"
        ]

@router.get("/health")
async def chat_health():
    """Check if the chat service is working."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {"contents": [{"parts": [{"text": "Say OK"}]}]}
            response = await client.post(GEMINI_URL, json=payload)
            if response.status_code == 200:
                return {"status": "ok", "gemini": "connected"}
            else:
                return {"status": "error", "detail": response.text}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
