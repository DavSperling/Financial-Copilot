from typing import Dict, List, TypedDict

class StockData(TypedDict):
    ticker: str
    name: str
    sector: str
    explanation: str

RISK_LEVEL_STOCKS: Dict[int, List[StockData]] = {
    1: [  # Conservative - 18 options focused on stability, dividends, and capital preservation
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
            "explanation": "An iconic brand with a massive global distribution network. Reliable dividend payer that offers a safe haven for capital preservation."
        },
        {
            "ticker": "PEP",
            "name": "PepsiCo Inc.",
            "sector": "Beverages",
            "explanation": "Diversified beverage and snack company with consistent revenue. Dividend Aristocrat offering stability and defensive characteristics."
        },
        {
            "ticker": "VZ",
            "name": "Verizon Communications",
            "sector": "Telecommunications",
            "explanation": "Leading telecom provider with high dividend yield. Essential services generate predictable cash flows for income-focused investors."
        },
        {
            "ticker": "XOM",
            "name": "Exxon Mobil Corporation",
            "sector": "Energy",
            "explanation": "Energy giant with strong dividend history. Provides inflation hedge and steady income from integrated oil and gas operations."
        },
        {
            "ticker": "CVX",
            "name": "Chevron Corporation",
            "sector": "Energy",
            "explanation": "Diversified energy company with strong balance sheet. Offers reliable dividends and stability in the energy sector."
        },
        {
            "ticker": "WMT",
            "name": "Walmart Inc.",
            "sector": "Consumer Defensive",
            "explanation": "World's largest retailer with essential goods focus. Recession-resistant business model ideal for conservative portfolios."
        },
        {
            "ticker": "BRK-B",
            "name": "Berkshire Hathaway Class B",
            "sector": "Financial Services",
            "explanation": "Warren Buffett's diversified holding company. Exceptional capital allocation and low volatility make it perfect for conservative investors."
        },
        {
            "ticker": "VYM",
            "name": "Vanguard High Dividend Yield ETF",
            "sector": "ETF",
            "explanation": "ETF focused on high-dividend stocks with low fees. Provides diversified income stream with reduced single-stock risk."
        },
        {
            "ticker": "SCHD",
            "name": "Schwab US Dividend Equity ETF",
            "sector": "ETF",
            "explanation": "High-quality dividend stocks selected for sustainability. Excellent for conservative income-seeking investors."
        },
        {
            "ticker": "VIG",
            "name": "Vanguard Dividend Appreciation ETF",
            "sector": "ETF",
            "explanation": "Focuses on companies with growing dividends. Low cost and diversified approach to dividend growth investing."
        },
        {
            "ticker": "MMM",
            "name": "3M Company",
            "sector": "Industrials",
            "explanation": "Diversified industrial company with decades of dividend payments. Stable business across multiple sectors."
        },
        {
            "ticker": "ABT",
            "name": "Abbott Laboratories",
            "sector": "Healthcare",
            "explanation": "Diversified healthcare company with strong diagnostics and medical devices. Consistent dividend growth and defensive positioning."
        },
        {
            "ticker": "MCD",
            "name": "McDonald's Corporation",
            "sector": "Consumer Cyclical",
            "explanation": "Global fast-food leader with franchise model. Strong cash flows and dividend history appeal to conservative investors."
        },
        {
            "ticker": "HDV",
            "name": "iShares Core High Dividend ETF",
            "sector": "ETF",
            "explanation": "ETF of high-quality, high-dividend U.S. stocks. Low fees and diversification for income-focused portfolios."
        },
        {
            "ticker": "NOBL",
            "name": "ProShares S&P 500 Dividend Aristocrats ETF",
            "sector": "ETF",
            "explanation": "Invests in S&P 500 Dividend Aristocrats with 25+ years of dividend growth. Ultimate stability for conservative investors."
        }
    ],
    2: [  # Balanced - 18 options combining growth and stability
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
        },
        {
            "ticker": "MA",
            "name": "Mastercard Inc.",
            "sector": "Financial Services",
            "explanation": "Global payment network with strong international expansion. High margins and secular growth in cashless transactions."
        },
        {
            "ticker": "UNH",
            "name": "UnitedHealth Group",
            "sector": "Healthcare",
            "explanation": "Largest health insurer with integrated services model. Defensive healthcare exposure with growth from aging demographics."
        },
        {
            "ticker": "HD",
            "name": "The Home Depot",
            "sector": "Consumer Cyclical",
            "explanation": "Leading home improvement retailer with strong market position. Benefits from housing market and DIY trends."
        },
        {
            "ticker": "AVGO",
            "name": "Broadcom Inc.",
            "sector": "Technology",
            "explanation": "Diversified semiconductor and infrastructure software company. Offers growth exposure with strong dividend policy."
        },
        {
            "ticker": "LLY",
            "name": "Eli Lilly and Company",
            "sector": "Healthcare",
            "explanation": "Pharmaceutical leader with strong drug pipeline including obesity treatments. Growth potential with healthcare sector stability."
        },
        {
            "ticker": "VTI",
            "name": "Vanguard Total Stock Market ETF",
            "sector": "ETF",
            "explanation": "Broad exposure to entire U.S. stock market. Low-cost diversification ideal for balanced investors."
        },
        {
            "ticker": "VUG",
            "name": "Vanguard Growth ETF",
            "sector": "ETF",
            "explanation": "Large-cap growth stocks with reasonable volatility. Balanced approach to capturing market growth."
        },
        {
            "ticker": "QQQ",
            "name": "Invesco QQQ Trust",
            "sector": "ETF",
            "explanation": "Tracks Nasdaq-100 tech-heavy index. Growth exposure with diversification across top tech companies."
        },
        {
            "ticker": "DIS",
            "name": "The Walt Disney Company",
            "sector": "Communication Services",
            "explanation": "Entertainment giant with theme parks, streaming, and content. Brand strength provides stability with growth upside."
        },
        {
            "ticker": "ADBE",
            "name": "Adobe Inc.",
            "sector": "Technology",
            "explanation": "Creative software leader with strong subscription revenue. Stable recurring income with AI growth opportunities."
        },
        {
            "ticker": "CRM",
            "name": "Salesforce Inc.",
            "sector": "Technology",
            "explanation": "Enterprise cloud software leader. Steady growth from digital transformation trends with improving profitability."
        },
        {
            "ticker": "NEE",
            "name": "NextEra Energy",
            "sector": "Utilities",
            "explanation": "Largest renewable energy producer in North America. Clean energy growth with utility-like stability."
        },
        {
            "ticker": "ACN",
            "name": "Accenture plc",
            "sector": "Information Technology",
            "explanation": "Global consulting and technology services leader. Steady growth from enterprise digital transformation."
        }
    ],
    3: [  # Dynamic - 17 options focused on growth with higher volatility
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
        },
        {
            "ticker": "META",
            "name": "Meta Platforms Inc.",
            "sector": "Communication Services",
            "explanation": "Social media giant investing heavily in AI and metaverse. High growth potential with advertising dominance."
        },
        {
            "ticker": "CRWD",
            "name": "CrowdStrike Holdings",
            "sector": "Technology",
            "explanation": "Leading cybersecurity platform with cloud-native architecture. High growth from increasing enterprise security spending."
        },
        {
            "ticker": "SNOW",
            "name": "Snowflake Inc.",
            "sector": "Technology",
            "explanation": "Cloud data platform with rapid growth. Benefits from enterprise data analytics and AI adoption trends."
        },
        {
            "ticker": "SQ",
            "name": "Block Inc. (Square)",
            "sector": "Financial Technology",
            "explanation": "Fintech leader in payments and crypto. High growth potential from digital payments and Cash App expansion."
        },
        {
            "ticker": "DDOG",
            "name": "Datadog Inc.",
            "sector": "Technology",
            "explanation": "Cloud monitoring and analytics platform. Strong growth from digital infrastructure monitoring needs."
        },
        {
            "ticker": "PANW",
            "name": "Palo Alto Networks",
            "sector": "Technology",
            "explanation": "Enterprise cybersecurity leader. Benefits from growing security threats and cloud adoption."
        },
        {
            "ticker": "NOW",
            "name": "ServiceNow Inc.",
            "sector": "Technology",
            "explanation": "Enterprise workflow automation leader. Strong recurring revenue with AI integration opportunities."
        },
        {
            "ticker": "UBER",
            "name": "Uber Technologies",
            "sector": "Technology",
            "explanation": "Global ride-sharing and delivery platform. Growth from mobility recovery and delivery expansion."
        },
        {
            "ticker": "ANET",
            "name": "Arista Networks",
            "sector": "Technology",
            "explanation": "Cloud networking equipment leader. Benefits from data center growth and AI infrastructure buildout."
        },
        {
            "ticker": "TTD",
            "name": "The Trade Desk",
            "sector": "Technology",
            "explanation": "Programmatic advertising platform leader. Growth from digital advertising shift and connected TV."
        },
        {
            "ticker": "MELI",
            "name": "MercadoLibre Inc.",
            "sector": "Consumer Cyclical",
            "explanation": "Latin America's e-commerce and fintech leader. High growth from emerging market digital adoption."
        },
        {
            "ticker": "ARKW",
            "name": "ARK Next Generation Internet ETF",
            "sector": "ETF",
            "explanation": "ETF focused on next-gen internet companies. Thematic exposure to cloud, AI, and digital innovation."
        }
    ],
    4: [  # Aggressive - 18 options for maximum growth with high risk tolerance
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
        },
        {
            "ticker": "SOFI",
            "name": "SoFi Technologies",
            "sector": "Financial Services",
            "explanation": "Digital financial services platform disrupting traditional banking. High growth potential with fintech innovation."
        },
        {
            "ticker": "UPST",
            "name": "Upstart Holdings",
            "sector": "Financial Services",
            "explanation": "AI-powered lending platform. High volatility with significant upside from AI-driven credit assessment revolution."
        },
        {
            "ticker": "RKLB",
            "name": "Rocket Lab USA",
            "sector": "Aerospace",
            "explanation": "Small satellite launch provider competing in space economy. High risk, high reward play on commercial space."
        },
        {
            "ticker": "IONQ",
            "name": "IonQ Inc.",
            "sector": "Technology",
            "explanation": "Quantum computing pioneer. Extremely speculative but could provide massive returns if quantum computing advances."
        },
        {
            "ticker": "RIVN",
            "name": "Rivian Automotive",
            "sector": "Consumer Cyclical",
            "explanation": "Electric vehicle startup backed by Amazon. High risk bet on EV competition and production scaling."
        },
        {
            "ticker": "LCID",
            "name": "Lucid Group",
            "sector": "Consumer Cyclical",
            "explanation": "Luxury electric vehicle manufacturer. High risk with potential for significant returns if execution succeeds."
        },
        {
            "ticker": "PATH",
            "name": "UiPath Inc.",
            "sector": "Technology",
            "explanation": "Robotic process automation leader. High growth potential from enterprise automation adoption."
        },
        {
            "ticker": "AFRM",
            "name": "Affirm Holdings",
            "sector": "Financial Services",
            "explanation": "Buy-now-pay-later fintech leader. Volatile but benefits from consumer credit and shopping trends."
        },
        {
            "ticker": "HOOD",
            "name": "Robinhood Markets",
            "sector": "Financial Services",
            "explanation": "Commission-free trading platform targeting young investors. High beta play on retail trading activity."
        },
        {
            "ticker": "ARKG",
            "name": "ARK Genomic Revolution ETF",
            "sector": "ETF",
            "explanation": "ETF focused on genomics and biotech innovation. Highly volatile with potential breakthrough returns."
        },
        {
            "ticker": "SOUN",
            "name": "SoundHound AI",
            "sector": "Technology",
            "explanation": "Voice AI platform for automotive and IoT. Speculative AI play with high growth potential."
        },
        {
            "ticker": "AI",
            "name": "C3.ai Inc.",
            "sector": "Technology",
            "explanation": "Enterprise AI software platform. Volatile AI stock benefiting from enterprise AI adoption wave."
        },
        {
            "ticker": "ENVX",
            "name": "Enovix Corporation",
            "sector": "Technology",
            "explanation": "Advanced battery technology company. Speculative bet on next-gen battery innovation for EVs and devices."
        }
    ]
}
