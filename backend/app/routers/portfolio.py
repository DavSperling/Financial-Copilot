from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from app.services.portfolio_service import get_portfolio_recommendation

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
