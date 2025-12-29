from typing import Dict, List, TypedDict

class StockData(TypedDict):
    ticker: str
    name: str
    sector: str
    explanation: str

RISK_LEVEL_STOCKS: Dict[int, List[StockData]] = {
    1: [  # Conservative
        {
            "ticker": "MSFT",
            "name": "Microsoft Corporation",
            "sector": "Technology",
            "explanation": "Microsoft demonstrates exceptional stability with recurring revenue streams through Azure and Office 365. Ideal for conservative investors seeking steady growth with quarterly dividends."
        },
        {
            "ticker": "JNJ",
            "name": "Johnson & Johnson",
            "sector": "Healthcare",
            "explanation": "Healthcare sector leader with over 60 years of continuous dividend growth. Perfect for minimizing volatility while maintaining defensive market exposure."
        },
        {
            "ticker": "PG",
            "name": "Procter & Gamble",
            "sector": "Consumer Defensive",
            "explanation": "A consumer staples giant that performs well in all economic cycles. Provides reliable income and low volatility protection."
        },
        {
            "ticker": "KO",
            "name": "Coca-Cola Company",
            "sector": "Beverages",
            "explanation": "An iconic brand with a massive global distribution network. innovative dividend payer that offers a safe haven for capital preservation."
        }
    ],
    2: [  # Balanced
        {
            "ticker": "AAPL",
            "name": "Apple Inc.",
            "sector": "Technology",
            "explanation": "Apple combines a massive cash reserve with consistent buybacks and dividends. Offers a perfect balance of safety and capital appreciation."
        },
        {
            "ticker": "V",
            "name": "Visa Inc.",
            "sector": "Financial Services",
            "explanation": "Dominant global payment processor benefiting from the secular shift to digital payments. Offers solid growth with high profit margins."
        },
        {
            "ticker": "GOOGL",
            "name": "Alphabet Inc.",
            "sector": "Communication Services",
            "explanation": "Market leader in search and digital advertising with strong cloud growth. Provides growth potential with a relatively stable business model."
        },
        {
            "ticker": "JPM",
            "name": "JPMorgan Chase & Co.",
            "sector": "Financial Services",
            "explanation": "The largest U.S. bank with a diversified revenue model. Offers attractive valuation and dividends while participating in economic growth."
        },
        {
            "ticker": "COST",
            "name": "Costco Wholesale",
            "sector": "Consumer Cyclical",
            "explanation": "Best-in-class retailer with a loyal membership base. Delivers consistent steady growth and performs well even in inflationary environments."
        }
    ],
    3: [  # Dynamic
        {
            "ticker": "NVDA",
            "name": "NVIDIA Corporation",
            "sector": "Technology",
            "explanation": "The undisputed leader in AI computing hardware. Offers massive growth potential as AI adoption accelerates across all industries."
        },
        {
            "ticker": "AMD",
            "name": "Advanced Micro Devices",
            "sector": "Technology",
            "explanation": "Strong competitor in data center and consumer chips. Provides high beta exposure to the semiconductor cycle for growth-focused portfolios."
        },
        {
            "ticker": "TSLA",
            "name": "Tesla, Inc.",
            "sector": "Consumer Cyclical",
            "explanation": "Leader in EVs and clean energy storage. A high-volatility play on the future of transportation and energy."
        },
        {
            "ticker": "NFLX",
            "name": "Netflix, Inc.",
            "sector": "Communication Services",
            "explanation": "Dominant streaming platform with improving profitability. Offers dynamic growth through global expansion and ad-supported tiers."
        },
        {
            "ticker": "AMZN",
            "name": "Amazon.com Inc.",
            "sector": "Consumer Cyclical",
            "explanation": "E-commerce and cloud computing giant. Reinvests heavily for growth, making it suitable for investors willing to ride out volatility."
        }
    ],
    4: [  # Aggressive
        {
            "ticker": "COIN",
            "name": "Coinbase Global",
            "sector": "Financial Services",
            "explanation": "The leading US crypto exchange. A high-risk, high-reward proxy for the cryptocurrency market and blockchain adoption."
        },
        {
            "ticker": "PLTR",
            "name": "Palantir Technologies",
            "sector": "Technology",
            "explanation": "Data analytics firm deeply embedded in government and enterprise defense. Offers explosive growth potential but with significant valuation risk."
        },
        {
            "ticker": "SHOP",
            "name": "Shopify Inc.",
            "sector": "Technology",
            "explanation": "Powering the global e-commerce infrastructure. High growth stock that can be volatile but offers substantial long-term upside."
        },
        {
            "ticker": "ARKK",
            "name": "ARK Innovation ETF",
            "sector": "Fund",
            "explanation": "An active ETF focused on disruptive innovation. Gives exposure to a basket of high-growth, high-risk early stage technology companies."
        },
        {
            "ticker": "MSTR",
            "name": "MicroStrategy",
            "sector": "Technology",
            "explanation": "Enterprise software company that acts as a leveraged play on Bitcoin. Extremely volatile and suitable only for the most aggressive risk profiles."
        }
    ]
}
