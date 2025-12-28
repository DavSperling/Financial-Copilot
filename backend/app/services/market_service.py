import yfinance as yf
from typing import Dict, Optional, List
from functools import lru_cache
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Simple in-memory cache
_price_cache: Dict[str, tuple] = {}  # symbol -> (price, timestamp)
CACHE_DURATION = timedelta(minutes=5)  # Cache prices for 5 minutes


def get_current_price(symbol: str) -> Optional[float]:
    """
    Get the current price for a single stock symbol.
    Uses caching to avoid excessive API calls.
    
    Args:
        symbol: Stock ticker symbol (e.g., 'AAPL', 'TSLA', 'BTC-USD')
    
    Returns:
        Current price or None if not found
    """
    symbol = symbol.upper()
    
    # Check cache
    if symbol in _price_cache:
        price, timestamp = _price_cache[symbol]
        if datetime.now() - timestamp < CACHE_DURATION:
            return price
    
    try:
        ticker = yf.Ticker(symbol)
        
        # Try to get the current price from fast_info first
        try:
            price = ticker.fast_info.get('lastPrice')
            if price is None:
                price = ticker.fast_info.get('regularMarketPrice')
        except:
            price = None
        
        # Fallback to history if fast_info doesn't work
        if price is None:
            hist = ticker.history(period="1d")
            if not hist.empty:
                price = float(hist['Close'].iloc[-1])
        
        if price is not None:
            _price_cache[symbol] = (price, datetime.now())
            return float(price)
        
        logger.warning(f"Could not fetch price for symbol: {symbol}")
        return None
        
    except Exception as e:
        logger.error(f"Error fetching price for {symbol}: {e}")
        return None


def get_multiple_prices(symbols: List[str]) -> Dict[str, Optional[float]]:
    """
    Get current prices for multiple stock symbols.
    
    Args:
        symbols: List of stock ticker symbols
    
    Returns:
        Dictionary mapping symbol to current price (or None if not found)
    """
    result = {}
    
    # First check cache for all symbols
    symbols_to_fetch = []
    for symbol in symbols:
        symbol = symbol.upper()
        if symbol in _price_cache:
            price, timestamp = _price_cache[symbol]
            if datetime.now() - timestamp < CACHE_DURATION:
                result[symbol] = price
                continue
        symbols_to_fetch.append(symbol)
    
    # Fetch remaining symbols
    if symbols_to_fetch:
        try:
            # Use yfinance download for batch fetching (more efficient)
            data = yf.download(
                symbols_to_fetch, 
                period="1d", 
                progress=False,
                threads=True
            )
            
            if not data.empty:
                # Handle single symbol case
                if len(symbols_to_fetch) == 1:
                    symbol = symbols_to_fetch[0]
                    if 'Close' in data.columns:
                        price = float(data['Close'].iloc[-1])
                        result[symbol] = price
                        _price_cache[symbol] = (price, datetime.now())
                else:
                    # Handle multiple symbols
                    for symbol in symbols_to_fetch:
                        try:
                            if ('Close', symbol) in data.columns:
                                close_prices = data['Close'][symbol]
                                if not close_prices.empty:
                                    price = float(close_prices.iloc[-1])
                                    result[symbol] = price
                                    _price_cache[symbol] = (price, datetime.now())
                        except Exception as e:
                            logger.warning(f"Could not get price for {symbol}: {e}")
                            result[symbol] = None
        except Exception as e:
            logger.error(f"Error batch fetching prices: {e}")
            # Fallback to individual fetching
            for symbol in symbols_to_fetch:
                result[symbol] = get_current_price(symbol)
    
    # Fill in None for any missing symbols
    for symbol in symbols:
        symbol = symbol.upper()
        if symbol not in result:
            result[symbol] = None
    
    return result


def get_stock_info(symbol: str) -> Optional[Dict]:
    """
    Get detailed stock information.
    
    Args:
        symbol: Stock ticker symbol
    
    Returns:
        Dictionary with stock info or None
    """
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info
        
        return {
            "symbol": symbol.upper(),
            "name": info.get("shortName") or info.get("longName"),
            "currency": info.get("currency", "USD"),
            "exchange": info.get("exchange"),
            "sector": info.get("sector"),
            "marketCap": info.get("marketCap"),
            "currentPrice": info.get("currentPrice") or info.get("regularMarketPrice"),
            "previousClose": info.get("previousClose"),
            "dayHigh": info.get("dayHigh"),
            "dayLow": info.get("dayLow"),
            "volume": info.get("volume"),
            "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
            "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
        }
    except Exception as e:
        logger.error(f"Error fetching info for {symbol}: {e}")
        return None


def clear_cache():
    """Clear the price cache."""
    global _price_cache
    _price_cache = {}
