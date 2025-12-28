from pydantic import BaseModel, Field, field_validator
from typing import List

class InvestmentRequest(BaseModel):
    """
    Request model for investment calculation parameters.
    """
    monthly_amount: float = Field(..., description="Monthly contribution in ILS", ge=100, le=50000)
    years: int = Field(..., description="Investment period in years", ge=1, le=30)
    annual_return: float = Field(..., description="Expected annual return percentage", ge=2, le=15)
    initial_investment: float = Field(default=0, description="Initial lump sum investment in ILS", ge=0, le=100000)

    @field_validator('monthly_amount')
    def validate_amount(cls, v):
        if v < 100 or v > 50000:
            raise ValueError('Monthly amount must be between 100 and 50,000 ILS')
        return v
        
    @field_validator('years')
    def validate_years(cls, v):
        if v < 1 or v > 30:
            raise ValueError('Years must be between 1 and 30')
        return v

    @field_validator('annual_return')
    def validate_return(cls, v):
        if v < 2 or v > 15:
            raise ValueError('Annual return must be between 2% and 15%')
        return v

class InvestmentResponse(BaseModel):
    """
    Response model for investment calculation results.
    """
    future_value: float = Field(..., description="Total portfolio value after the period")
    total_contributed: float = Field(..., description="Sum of all monthly contributions")
    total_earnings: float = Field(..., description="Investment gains")
    yearly_breakdown: List[float] = Field(..., description="Array showing portfolio value at end of each year")
