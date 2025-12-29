from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from app.services.portfolio_service import get_portfolio_recommendation, get_stock_recommendations, add_asset_to_portfolio
from app.schemas import StockRecommendation, RecommendationResponse, AcceptRecommendationRequest

router = APIRouter(
    prefix="/recommendations",
    tags=["Portfolio Recommendations"]
)

class AIProposal(BaseModel):
    id: str
    title: str
    description: str
    impact_return: float = Field(..., description="Impact on expected return (%)")
    impact_risk: float = Field(..., description="Impact on volatility (%)")
    priority: str = Field(..., description="Priority level: high, medium, low")
    category: str = Field(..., description="Category: growth, protection, diversification, etc.")

class PortfolioRecommendation(BaseModel):
    profile_type: str = Field(..., description="The type of the portfolio profile")
    stocks: int = Field(..., description="Percentage allocated to stocks")
    bonds: int = Field(..., description="Percentage allocated to bonds")
    cash: int = Field(..., description="Percentage allocated to cash")
    expected_return: float = Field(..., description="Expected annual return (%)")
    volatility: float = Field(..., description="Expected volatility/risk (%)")
    sharpe_ratio: float = Field(..., description="Risk-adjusted return metric")
    min_horizon_years: int = Field(..., description="Minimum recommended investment horizon")
    explanation: str = Field(..., description="Explanation of the portfolio strategy")
    ai_proposals: List[AIProposal] = Field(..., description="AI-generated investment proposals")

@router.get("", response_model=PortfolioRecommendation)
async def get_recommendation(
    profile: int = Query(..., ge=1, le=4, description="Risk profile score (1-4)")
):
    """
    Get portfolio asset allocation recommendation with AI proposals based on risk profile.

    - **profile**: An integer between 1 (Conservative) and 4 (Aggressive).
    
    Returns allocation percentages, financial metrics, and AI-generated proposals.
    """
    try:
        recommendation = get_portfolio_recommendation(profile)
        return recommendation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stocks", response_model=RecommendationResponse)
async def get_stocks(
    profile: int = Query(..., ge=1, le=4, description="Risk profile score (1-4)"),
    user_id: Optional[str] = Query(None, description="User ID for budget filtering")
):
    """
    Get a list of specific stock recommendations for the risk profile.
    If user_id is provided, filters stocks based on affordability (Initial Investment - Current Holdings).
    """
    result = get_stock_recommendations(profile, user_id)
    # result is a dict matching RecommendationResponse
    if not result["recommendations"] and user_id:
         # Loophole: if filtering removed everything, we still return empty list + budget info
         pass
         
    return result

@router.post("/assets")
async def add_asset(request: AcceptRecommendationRequest):
    """
    Accept a recommendation and add it to user's assets.
    """
    try:
        result = add_asset_to_portfolio(request)
        return {"message": "Asset added successfully", "asset": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
