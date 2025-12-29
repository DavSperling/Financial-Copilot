from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from app.models.investment import InvestmentRequest, InvestmentResponse
from app.services.investment_calculator import calculate_compound_interest
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import base64

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
            annual_return=request.annual_return,
            initial_investment=request.initial_investment
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred during calculation")


@router.post("/chart", summary="Generate Investment Chart")
async def generate_chart(request: InvestmentRequest):
    """
    Generate a matplotlib chart showing investment growth over time.
    Returns the chart as a base64 encoded PNG image.
    """
    try:
        result = calculate_compound_interest(
            monthly_amount=request.monthly_amount,
            years=request.years,
            annual_return=request.annual_return,
            initial_investment=request.initial_investment
        )
        
        yearly_breakdown = result["yearly_breakdown"]
        years_range = list(range(len(yearly_breakdown) + 1))
        
        # Build data
        contributed = [request.initial_investment]
        values = [request.initial_investment]
        
        for i, val in enumerate(yearly_breakdown):
            year = i + 1
            contrib = request.initial_investment + (request.monthly_amount * 12 * year)
            contributed.append(contrib)
            values.append(val)
        
        # Create the figure
        fig, ax = plt.subplots(figsize=(10, 6), dpi=100)
        
        # Plot lines
        ax.plot(years_range, contributed, 'b-', linewidth=2.5, marker='o', markersize=6, label='Total Contributed')
        ax.plot(years_range, values, 'g-', linewidth=2.5, marker='o', markersize=6, label='Total Value (with gains)')
        
        # Fill between
        ax.fill_between(years_range, contributed, alpha=0.2, color='blue')
        ax.fill_between(years_range, values, alpha=0.2, color='green')
        
        # Formatting
        ax.set_xlabel('Years', fontsize=12, fontweight='bold')
        ax.set_ylabel('Amount ($)', fontsize=12, fontweight='bold')
        ax.set_title(f'Investment Growth Over {request.years} Years (at {request.annual_return}% annual return)', 
                     fontsize=14, fontweight='bold', pad=15)
        
        # Format y-axis as currency
        def format_ils(x, pos):
            if x >= 1000000:
                return f'${x/1000000:.1f}M'
            elif x >= 1000:
                return f'${x/1000:.0f}k'
            return f'${x:.0f}'
        
        ax.yaxis.set_major_formatter(plt.FuncFormatter(format_ils))
        
        # Grid and legend
        ax.grid(True, linestyle='--', alpha=0.7)
        ax.legend(loc='upper left', fontsize=11)
        
        # Set x-axis ticks to show all years
        ax.set_xticks(years_range)
        ax.set_xlim(0, request.years)
        ax.set_ylim(0, max(values) * 1.1)
        
        # Tight layout
        plt.tight_layout()
        
        # Save to bytes
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', facecolor='white', edgecolor='none')
        buf.seek(0)
        plt.close(fig)
        
        # Encode to base64
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        
        return {
            "chart_image": f"data:image/png;base64,{img_base64}",
            "future_value": result["future_value"],
            "total_contributed": result["total_contributed"],
            "total_earnings": result["total_earnings"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating chart: {str(e)}")

