from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.services.portfolio_service import get_portfolio_recommendation

router = APIRouter(
    prefix="/recommendations",
    tags=["Portfolio Recommendations"]
)

class PortfolioRecommendation(BaseModel):
    profile_type: str = Field(..., description="The type of the portfolio profile (e.g., Conservative, Balanced)")
    stocks: int = Field(..., description="Percentage allocated to stocks")
    bonds: int = Field(..., description="Percentage allocated to bonds")
    cash: int = Field(..., description="Percentage allocated to cash")
    explanation: str = Field(..., description="Explanation of the portfolio strategy")

@router.get("", response_model=PortfolioRecommendation)
async def get_recommendation(
    profile: int = Query(..., ge=1, le=4, description="Risk profile score (1-4)")
):
    """
    Get portfolio asset allocation recommendation based on risk profile.

    - **profile**: An integer between 1 (Conservative) and 4 (Aggressive).
    
    Returns allocation percentages for stocks, bonds, and cash along with an explanation.
    """
    try:
        recommendation = get_portfolio_recommendation(profile)
        return recommendation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
