from typing import Dict, Union, List

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
