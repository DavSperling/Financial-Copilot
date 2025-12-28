from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.market_service import get_current_price, get_multiple_prices, get_stock_info

router = APIRouter(
    prefix="/market",
    tags=["Market Data"]
)


class PriceRequest(BaseModel):
    symbols: List[str]


class PriceResponse(BaseModel):
    prices: Dict[str, Optional[float]]


class StockInfo(BaseModel):
    symbol: str
    name: Optional[str]
    currency: Optional[str]
    exchange: Optional[str]
    sector: Optional[str]
    marketCap: Optional[float]
    currentPrice: Optional[float]
    previousClose: Optional[float]
    dayHigh: Optional[float]
    dayLow: Optional[float]
    volume: Optional[int]
    fiftyTwoWeekHigh: Optional[float]
    fiftyTwoWeekLow: Optional[float]


@router.get("/price/{symbol}", summary="Get current price for a symbol")
async def get_price(symbol: str):
    """
    Get the current market price for a single stock symbol.
    
    - **symbol**: Stock ticker symbol (e.g., AAPL, TSLA, BTC-USD)
    
    For Israeli stocks, add .TA suffix (e.g., TEVA.TA)
    """
    price = get_current_price(symbol)
    
    if price is None:
        raise HTTPException(
            status_code=404, 
            detail=f"Could not find price for symbol: {symbol}. Make sure the symbol is correct."
        )
    
    return {
        "symbol": symbol.upper(),
        "price": price
    }


@router.post("/prices", response_model=PriceResponse, summary="Get prices for multiple symbols")
async def get_prices(request: PriceRequest):
    """
    Get current market prices for multiple stock symbols at once.
    
    - **symbols**: List of stock ticker symbols
    
    Returns a dictionary mapping each symbol to its current price.
    Symbols that couldn't be found will have null value.
    """
    if not request.symbols:
        raise HTTPException(status_code=400, detail="Please provide at least one symbol")
    
    if len(request.symbols) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 symbols per request")
    
    prices = get_multiple_prices(request.symbols)
    
    return {"prices": prices}


@router.get("/info/{symbol}", summary="Get detailed stock information")
async def get_info(symbol: str):
    """
    Get detailed information about a stock.
    
    - **symbol**: Stock ticker symbol
    
    Returns company info, market data, and key statistics.
    """
    info = get_stock_info(symbol)
    
    if info is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not find information for symbol: {symbol}"
        )
    
    return info
