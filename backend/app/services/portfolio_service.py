from typing import Dict, Union, List, Any
import yfinance as yf
from supabase import create_client, Client
from app.config import get_settings
from app.services.recommendation_data import RISK_LEVEL_STOCKS
from app.schemas import AcceptRecommendationRequest

settings = get_settings()
# Initialize Supabase Admin Client for database operations
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def get_portfolio_recommendation(risk_profile: int) -> Dict[str, Union[str, int, float, List]]:
    """
    Calculate asset allocation and generate AI analysis based on risk profile.

    Args:
        risk_profile (int): Integer between 1 and 4 representing the risk profile.
            1: Conservative
            2: Balanced
            3: Dynamic
            4: Aggressive

    Returns:
        Dict containing allocation, metrics, and AI proposals.
    """
    if not isinstance(risk_profile, int) or not (1 <= risk_profile <= 4):
        raise ValueError("Risk profile must be an integer between 1 and 4.")

    allocations = {
        1: {
            "profile_type": "Conservative",
            "stocks": 20,
            "bonds": 60,
            "cash": 20,
            "expected_return": 4.5,
            "volatility": 6.0,
            "sharpe_ratio": 0.58,
            "min_horizon_years": 2,
            "explanation": "A conservative portfolio focuses on capital preservation and income. It works best for investors with a low tolerance for risk or those approaching retirement.",
            "ai_proposals": [
                {
                    "id": "prop_1",
                    "title": "Add inflation-protected bonds",
                    "description": "Replace 10% of regular bonds with TIPS (Treasury Inflation-Protected Securities) to protect purchasing power.",
                    "impact_return": 0.2,
                    "impact_risk": -0.5,
                    "priority": "high",
                    "category": "protection"
                },
                {
                    "id": "prop_2",
                    "title": "Reduce cash allocation",
                    "description": "Move 5% from cash to high-grade corporate bonds for better yield while maintaining safety.",
                    "impact_return": 0.4,
                    "impact_risk": 0.3,
                    "priority": "medium",
                    "category": "optimization"
                },
                {
                    "id": "prop_3",
                    "title": "Add dividend aristocrats",
                    "description": "Allocate 5% to dividend aristocrat stocks for stable income growth.",
                    "impact_return": 0.6,
                    "impact_risk": 0.8,
                    "priority": "low",
                    "category": "income"
                }
            ]
        },
        2: {
            "profile_type": "Balanced",
            "stocks": 50,
            "bonds": 35,
            "cash": 15,
            "expected_return": 6.5,
            "volatility": 10.0,
            "sharpe_ratio": 0.52,
            "min_horizon_years": 5,
            "explanation": "A balanced portfolio combines growth potential with stability. Suitable for investors with moderate risk tolerance seeking long-term wealth building.",
            "ai_proposals": [
                {
                    "id": "prop_1",
                    "title": "Diversify internationally",
                    "description": "Add 10% exposure to international developed markets (Europe, Japan) for geographical diversification.",
                    "impact_return": 0.5,
                    "impact_risk": 0.2,
                    "priority": "high",
                    "category": "diversification"
                },
                {
                    "id": "prop_2",
                    "title": "Add real estate exposure",
                    "description": "Include 5% REITs (Real Estate Investment Trusts) for income and inflation hedge.",
                    "impact_return": 0.7,
                    "impact_risk": 0.5,
                    "priority": "high",
                    "category": "diversification"
                },
                {
                    "id": "prop_3",
                    "title": "Optimize bond duration",
                    "description": "Shift to intermediate-term bonds (3-7 years) for better risk/reward balance.",
                    "impact_return": 0.3,
                    "impact_risk": -0.2,
                    "priority": "medium",
                    "category": "optimization"
                },
                {
                    "id": "prop_4",
                    "title": "Consider ESG funds",
                    "description": "Replace 15% of stocks with ESG-focused funds for sustainable investing.",
                    "impact_return": -0.1,
                    "impact_risk": 0.0,
                    "priority": "low",
                    "category": "sustainability"
                }
            ]
        },
        3: {
            "profile_type": "Dynamic",
            "stocks": 70,
            "bonds": 20,
            "cash": 10,
            "expected_return": 8.0,
            "volatility": 14.0,
            "sharpe_ratio": 0.47,
            "min_horizon_years": 7,
            "explanation": "A dynamic portfolio leans towards growth, suitable for investors with a longer time horizon and tolerance for market volatility.",
            "ai_proposals": [
                {
                    "id": "prop_1",
                    "title": "Add emerging markets",
                    "description": "Allocate 10% to emerging markets (China, India, Brazil) for higher growth potential.",
                    "impact_return": 1.2,
                    "impact_risk": 2.5,
                    "priority": "high",
                    "category": "growth"
                },
                {
                    "id": "prop_2",
                    "title": "Include small-cap stocks",
                    "description": "Add 8% exposure to small-cap growth stocks for enhanced returns.",
                    "impact_return": 1.0,
                    "impact_risk": 1.8,
                    "priority": "high",
                    "category": "growth"
                },
                {
                    "id": "prop_3",
                    "title": "Add technology sector tilt",
                    "description": "Overweight technology sector by 5% for exposure to innovation leaders.",
                    "impact_return": 0.8,
                    "impact_risk": 1.2,
                    "priority": "medium",
                    "category": "sector"
                },
                {
                    "id": "prop_4",
                    "title": "Reduce bond allocation",
                    "description": "Move 5% from bonds to stocks given your long horizon.",
                    "impact_return": 0.6,
                    "impact_risk": 1.0,
                    "priority": "low",
                    "category": "optimization"
                }
            ]
        },
        4: {
            "profile_type": "Aggressive",
            "stocks": 90,
            "bonds": 5,
            "cash": 5,
            "expected_return": 10.0,
            "volatility": 18.0,
            "sharpe_ratio": 0.44,
            "min_horizon_years": 10,
            "explanation": "An aggressive portfolio maximizes growth through high stock exposure. Designed for investors with high risk tolerance and very long investment horizon.",
            "ai_proposals": [
                {
                    "id": "prop_1",
                    "title": "Maximum emerging markets",
                    "description": "Increase emerging markets to 20% for maximum growth potential.",
                    "impact_return": 2.0,
                    "impact_risk": 4.0,
                    "priority": "high",
                    "category": "growth"
                },
                {
                    "id": "prop_2",
                    "title": "Add cryptocurrency exposure",
                    "description": "Consider 2-5% allocation to Bitcoin/Ethereum for portfolio diversification.",
                    "impact_return": 3.0,
                    "impact_risk": 8.0,
                    "priority": "medium",
                    "category": "alternative"
                },
                {
                    "id": "prop_3",
                    "title": "Leverage growth sectors",
                    "description": "Add exposure to AI, clean energy, and biotech sectors.",
                    "impact_return": 1.5,
                    "impact_risk": 2.0,
                    "priority": "high",
                    "category": "thematic"
                },
                {
                    "id": "prop_4",
                    "title": "Add private equity exposure",
                    "description": "Consider 5% in private equity funds for illiquidity premium.",
                    "impact_return": 2.5,
                    "impact_risk": 3.0,
                    "priority": "low",
                    "category": "alternative"
                },
                {
                    "id": "prop_5",
                    "title": "Remove remaining bonds",
                    "description": "Go 100% equity for maximum long-term growth.",
                    "impact_return": 0.5,
                    "impact_risk": 1.5,
                    "priority": "low",
                    "category": "optimization"
                }
            ]
        }
    }

    return allocations[risk_profile]


def get_stock_recommendations(risk_profile: int, user_id: str = None) -> Dict[str, Any]:
    """
    Get list of real stock recommendations for a given risk profile.
    Fetches real-time prices using yfinance.
    Now filters based on user's remaining budget.
    """
    remaining_budget = 1000000.0 # Default High budget if no user
    
    if user_id:
        try:
            # 1. Fetch User Profile for Initial Investment
            profile_response = supabase_admin.table("user_profiles").select("initial_investment").eq("user_id", user_id).execute()
            if profile_response.data:
                initial_investment = float(profile_response.data[0].get("initial_investment") or 0)
                
                # 2. Fetch Assets for Total Invested
                assets_response = supabase_admin.table("assets").select("amount, price").eq("user_id", user_id).execute()
                total_invested = sum(float(a["amount"]) * float(a["price"]) for a in assets_response.data)
                
                remaining_budget = max(0, initial_investment - total_invested)
            else:
                 # If no profile found, assume 0 or handle logic?
                 # Let's assume infinite for now so we don't block fresh users without profile
                 pass
        except Exception as e:
            print(f"Error calculating budget: {e}")

    if risk_profile not in RISK_LEVEL_STOCKS:
        return {"remaining_budget": remaining_budget, "recommendations": []}

    stocks = RISK_LEVEL_STOCKS[risk_profile]
    tickers = [s["ticker"] for s in stocks]
    
    try:
        data = yf.download(tickers, period="1d", progress=False)
        
        results = []
        for stock in stocks:
            ticker = stock["ticker"]
            price = 0.0
            try:
                # Handle yfinance multi-index columns vs single index
                # When multiple tickers, 'Close' is a DF with tickers as columns.
                # When single, it might be a Series.
                
                # Safer individual fetch loop fallback if bulk structure varies
                if not data.empty:
                    if isinstance(data.columns, pd.MultiIndex):
                         # Not handled in this snippet, falling back to per-ticker fetch for robustness
                         pass 
                
                # Let's use individual fetches to be 100% robust against dataframe structure changes
                ticker_obj = yf.Ticker(ticker)
                hist = ticker_obj.history(period="1d")
                if not hist.empty:
                    price = float(hist['Close'].iloc[-1])
            except Exception:
                # Fallback to download if Ticker fails
                 try:
                    df = yf.download(ticker, period="1d", progress=False)
                    if not df.empty:
                         price = float(df['Close'].iloc[-1])
                 except:
                    price = 0.0

            if price > 0:
                # Filter: Only include if price <= remaining_budget (only if user_id was provided)
                # If user_id provided, strict filtering.
                # Actually, maybe we should return all but mark them? 
                # User request: "tu me propose des action que je peut achete" -> strict filter seems appropriate.
                
                # If budget is 0 (e.g. no profile set), maybe show all? 
                # "initial_investment" default might be null.
                # Let's show all if remaining_budget is essentially 0 (floating point issue) AND no user_id?
                # But if user has $0 budget, we should probably show nothing or cheap stocks.
                
                # Interpretation: If remaining_budget > 0, filter. If 0 and user exists, filter (returns empty). 
                # If user_id None, show all.
                
                if user_id:
                     if price <= remaining_budget:
                        results.append({
                            "ticker": ticker,
                            "name": stock["name"],
                            "sector": stock["sector"],
                            "explanation": stock["explanation"],
                            "current_price": round(price, 2)
                        })
                else:
                     results.append({
                        "ticker": ticker,
                        "name": stock["name"],
                        "sector": stock["sector"],
                        "explanation": stock["explanation"],
                        "current_price": round(price, 2)
                    })
            
        return {
            "remaining_budget": remaining_budget if user_id else -1, # -1 indicates "unknown/unlimited"
            "recommendations": results
        }

    except Exception as e:
        print(f"Error in get_stock_recommendations: {e}")
        return {"remaining_budget": remaining_budget, "recommendations": []}
    """
    Get list of real stock recommendations for a given risk profile.
    Fetches real-time prices using yfinance.
    """
    if risk_profile not in RISK_LEVEL_STOCKS:
        return []

    stocks = RISK_LEVEL_STOCKS[risk_profile]
    tickers = [s["ticker"] for s in stocks]
    
    try:
        # Fetch prices in batch
        # yf.Tickers might correspond to multiple tickers
        # download is often faster for batch but requires parsing DataFrame. 
        # For simplicity and reliability with current yfinance versions:
        # We can iterate or use Tickers.
        
        # Using Tickers for metadata + price
        # Note: fetching info can be slow. 
        # faster approach: download '1d' data for all
        data = yf.download(tickers, period="1d", progress=False)['Close']
        
        # If single ticker result is a Series, if multiple it's a DataFrame
        # But yfinance behavior varies.
        # Fallback loop is safest for 5 tickers to avoid parsing complexity
        
        results = []
        for stock in stocks:
            ticker = stock["ticker"]
            price = 0.0
            try:
                # Try fast download of last 1 day
                # This returns a DataFrame
                df = yf.download(ticker, period="1d", progress=False)
                if not df.empty:
                    # Generic way to get the last Close value
                     price = float(df['Close'].iloc[-1])
            except Exception as e:
                print(f"Error fetching {ticker}: {e}")
                price = 0.0 # Indicate error or fallback

            results.append({
                "ticker": ticker,
                "name": stock["name"],
                "sector": stock["sector"],
                "explanation": stock["explanation"],
                "current_price": round(price, 2)
            })
            
        return results

    except Exception as e:
        print(f"Error in get_stock_recommendations: {e}")
        return []

def add_asset_to_portfolio(request: AcceptRecommendationRequest) -> Dict[str, Any]:
    """
    Add a recommended asset to the user's portfolio.
    """
    try:
        # Insert into assets table
        data = {
            "user_id": request.user_id,
            "symbol": request.ticker,
            "name": request.name,
            "type": request.type,
            "amount": request.amount,
            "price": request.price
        }
        
        response = supabase_admin.table("assets").insert(data).execute()
        return response.data[0] if response.data else {}
        
    except Exception as e:
        print(f"Error adding asset: {e}")
        raise e
