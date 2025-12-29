from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="The access_token from the recovery URL")
    new_password: str = Field(..., min_length=8)

class StockRecommendation(BaseModel):
    ticker: str
    name: str
    sector: str
    current_price: float
    explanation: str

class RecommendationResponse(BaseModel):
    remaining_budget: float
    recommendations: List[StockRecommendation]

class AcceptRecommendationRequest(BaseModel):
    user_id: str
    ticker: str
    name: str
    price: float
    amount: float = 1.0  # Default to 1 unit, or we could ask user, but let's assume 1 or use price to calc? prompt says "Adds the stock... with real market price". Let's assume quantity 1 for now or handled later.
    type: str = "Stock"
