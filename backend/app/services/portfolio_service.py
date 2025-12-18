from typing import Dict, Union

def get_portfolio_recommendation(risk_profile: int) -> Dict[str, Union[str, int]]:
    """
    Calculate asset allocation based on risk profile.

    Args:
        risk_profile (int): Integer between 1 and 4 representing the risk profile.
            1: Conservative
            2: Balanced
            3: Dynamic
            4: Aggressive

    Returns:
        Dict[str, Union[str, int]]: A dictionary containing allocation percentages and an explanation.

    Raises:
        ValueError: If risk_profile is not between 1 and 4.
    """
    if not isinstance(risk_profile, int) or not (1 <= risk_profile <= 4):
        raise ValueError("Risk profile must be an integer between 1 and 4.")

    allocations = {
        1: {
            "profile_type": "Conservative",
            "stocks": 20,
            "bonds": 60,
            "cash": 20,
            "explanation": "A conservative portfolio focuses on capital preservation and income. It works best for investors with a low tolerance for risk or those approaching retirement."
        },
        2: {
            "profile_type": "Balanced",
            "stocks": 50,
            "bonds": 35,
            "cash": 15,
            "explanation": "A balanced portfolio is suitable for investors with moderate risk tolerance. It combines growth potential with stability."
        },
        3: {
            "profile_type": "Dynamic",
            "stocks": 70,
            "bonds": 20,
            "cash": 10,
            "explanation": "A dynamic portfolio leans towards growth, making it suitable for investors with a longer time horizon and some tolerance for market volatility."
        },
        4: {
            "profile_type": "Aggressive",
            "stocks": 90,
            "bonds": 5,
            "cash": 5,
            "explanation": "An aggressive portfolio maximizes growth potential through high exposure to stocks. It is designed for investors with a high risk tolerance and a long investment horizon."
        }
    }

    return allocations[risk_profile]
