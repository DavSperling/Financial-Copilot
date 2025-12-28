from typing import Dict, List, Any

def calculate_compound_interest(monthly_amount: float, years: int, annual_return: float, initial_investment: float = 0) -> Dict[str, Any]:
    """
    Calculates compound interest for a monthly investment with optional initial lump sum.
    
    Args:
        monthly_amount: Monthly contribution in ILS
        years: Investment period in years
        annual_return: Expected annual return percentage (e.g., 7.0)
        initial_investment: Initial lump sum investment in ILS (default: 0)
        
    Returns:
        Dictionary containing future_value, total_contributed, total_earnings, and yearly_breakdown
    """
    # Convert annual percentage to monthly decimal rate
    monthly_rate = (annual_return / 100) / 12
    total_months = years * 12
    
    # Calculate Future Value of monthly contributions
    # FV = P * (((1 + r)^n - 1) / r)
    monthly_future_value = monthly_amount * (((1 + monthly_rate) ** total_months - 1) / monthly_rate)
    
    # Calculate Future Value of initial investment
    # FV = PV * (1 + r)^n
    initial_future_value = initial_investment * ((1 + monthly_rate) ** total_months)
    
    # Total future value
    future_value = monthly_future_value + initial_future_value
    
    # Calculate totals
    total_contributed = (monthly_amount * total_months) + initial_investment
    total_earnings = future_value - total_contributed
    
    # Calculate yearly breakdown
    yearly_breakdown = []
    current_value = initial_investment  # Start with initial investment
    
    for year in range(1, years + 1):
        # Calculate value at end of this year
        # Simulating month by month ensures accuracy
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
