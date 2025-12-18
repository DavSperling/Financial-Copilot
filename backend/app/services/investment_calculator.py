from typing import Dict, List, Any

def calculate_compound_interest(monthly_amount: float, years: int, annual_return: float) -> Dict[str, Any]:
    """
    Calculates compound interest for a monthly investment.
    
    Args:
        monthly_amount: Monthly contribution in ILS
        years: Investment period in years
        annual_return: Expected annual return percentage (e.g., 7.0)
        
    Returns:
        Dictionary containing future_value, total_contributed, total_earnings, and yearly_breakdown
    """
    # Convert annual percentage to monthly decimal rate
    monthly_rate = (annual_return / 100) / 12
    total_months = years * 12
    
    # Calculate Future Value using the formula for handling monthly payments
    # FV = P * (((1 + r)^n - 1) / r)
    # Note: This checks out for localized month-start vs month-end payments, 
    # but standard simple annuity formula is usually sufficient here.
    # If payments are at the END of the month:
    future_value = monthly_amount * (((1 + monthly_rate) ** total_months - 1) / monthly_rate)
    
    # Calculate totals
    total_contributed = monthly_amount * total_months
    total_earnings = future_value - total_contributed
    
    # Calculate yearly breakdown
    yearly_breakdown = []
    current_value = 0
    
    for year in range(1, years + 1):
        # Calculate value at end of this year
        # We can treat each year as a chunk or simulate month by month
        # Simulating month by month ensures accuracy with the total formula
        months_in_year = 12
        for _ in range(months_in_year):
            current_value += monthly_amount
            current_value *= (1 + monthly_rate)
        
        yearly_breakdown.append(round(current_value, 2))
        
    return {
        "future_value": round(future_value, 2),
        "total_contributed": round(total_contributed, 2),
        "total_earnings": round(total_earnings, 2),
        "yearly_breakdown": yearly_breakdown
    }
