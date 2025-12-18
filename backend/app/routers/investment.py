from fastapi import APIRouter, HTTPException, Query
from app.models.investment import InvestmentRequest, InvestmentResponse
from app.services.investment_calculator import calculate_compound_interest

router = APIRouter(
    prefix="/investment",
    tags=["investment"]
)

@router.post("/calculate", response_model=InvestmentResponse, summary="Calculate Compound Interest")
async def calculate_investment(request: InvestmentRequest):
    """
    Calculate the projected value of an investment over time using compound interest.
    
    - **monthly_amount**: Amount contributed each month (in ILS)
    - **years**: Duration of the investment (in years)
    - **annual_return**: Expected annual return rate (in percentage)
    
    Returns future value, total contributions, earnings, and a year-by-year breakdown.
    """
    try:
        result = calculate_compound_interest(
            monthly_amount=request.monthly_amount,
            years=request.years,
            annual_return=request.annual_return
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred during calculation")
