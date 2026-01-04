from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

router = APIRouter(
    prefix="/portfolio",
    tags=["Portfolio Transactions"]
)

class ClosePositionRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    asset_id: int = Field(..., description="Asset ID to close")
    sale_price: float = Field(..., description="Sale price per unit")

class Transaction(BaseModel):
    id: int
    symbol: str
    name: str
    type: str
    quantity: float
    purchase_price: float
    sale_price: float
    total_cost: float
    total_revenue: float
    profit_loss: float
    profit_loss_percent: float
    purchase_date: datetime
    sale_date: datetime

class TransactionsResponse(BaseModel):
    transactions: List[Transaction]
    total_realized_gains: float
    total_transactions: int

@router.post("/close")
async def close_position(request: ClosePositionRequest):
    """
    Close a position: Remove from assets and create a transaction record.
    """
    print(f"[CLOSE] Received request: user_id={request.user_id}, asset_id={request.asset_id}, sale_price={request.sale_price}")
    
    try:
        # 1. Fetch the asset
        asset_response = supabase_admin.table("assets").select("*").eq("id", request.asset_id).eq("user_id", request.user_id).execute()
        print(f"[CLOSE] Asset query result: {asset_response.data}")
        
        if not asset_response.data:
            print(f"[CLOSE] Asset not found!")
            raise HTTPException(status_code=404, detail="Asset not found")
        
        asset = asset_response.data[0]
        
        # 2. Create transaction record
        quantity = float(asset["amount"])
        purchase_price = float(asset["price"])
        total_cost = quantity * purchase_price
        total_revenue = quantity * request.sale_price
        profit_loss = total_revenue - total_cost
        profit_loss_percent = ((request.sale_price - purchase_price) / purchase_price * 100) if purchase_price > 0 else 0
        
        transaction_data = {
            "user_id": request.user_id,
            "symbol": asset["symbol"],
            "name": asset["name"],
            "type": asset["type"],
            "quantity": quantity,
            "purchase_price": purchase_price,
            "sale_price": request.sale_price,
            "purchase_date": asset["created_at"],
            "sale_date": datetime.now().isoformat(),
            "total_cost": round(total_cost, 2),
            "total_revenue": round(total_revenue, 2),
            "profit_loss": round(profit_loss, 2),
            "profit_loss_percent": round(profit_loss_percent, 2),
            "original_asset_id": asset["id"]
        }
        print(f"[CLOSE] Transaction data to insert: {transaction_data}")
        
        tx_response = supabase_admin.table("transactions").insert(transaction_data).execute()
        print(f"[CLOSE] Transaction insert result: {tx_response.data}")
        
        if not tx_response.data:
            print(f"[CLOSE] Transaction insert failed - no data returned")
            raise HTTPException(status_code=500, detail="Failed to create transaction")
        
        # 3. Delete the asset from portfolio
        delete_response = supabase_admin.table("assets").delete().eq("id", request.asset_id).execute()
        print(f"[CLOSE] Asset deleted: {delete_response}")
        
        return {
            "message": "Position closed successfully",
            "transaction": tx_response.data[0],
            "profit_loss": round(profit_loss, 2),
            "profit_loss_percent": round(profit_loss_percent, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CLOSE] Error closing position: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions", response_model=TransactionsResponse)
async def get_transactions(
    user_id: str = Query(..., description="User ID")
):
    """
    Get all transactions (closed positions) for a user.
    """
    try:
        response = supabase_admin.table("transactions").select("*").eq("user_id", user_id).order("sale_date", desc=True).execute()
        
        transactions = []
        total_realized_gains = 0.0
        
        for tx in response.data:
            profit_loss = float(tx.get("profit_loss", 0) or 0)
            total_realized_gains += profit_loss
            
            transactions.append(Transaction(
                id=tx["id"],
                symbol=tx["symbol"],
                name=tx["name"],
                type=tx["type"],
                quantity=float(tx["quantity"]),
                purchase_price=float(tx["purchase_price"]),
                sale_price=float(tx["sale_price"]),
                total_cost=float(tx.get("total_cost", 0) or 0),
                total_revenue=float(tx.get("total_revenue", 0) or 0),
                profit_loss=profit_loss,
                profit_loss_percent=float(tx.get("profit_loss_percent", 0) or 0),
                purchase_date=tx["purchase_date"],
                sale_date=tx["sale_date"]
            ))
        
        return TransactionsResponse(
            transactions=transactions,
            total_realized_gains=round(total_realized_gains, 2),
            total_transactions=len(transactions)
        )
        
    except Exception as e:
        print(f"Error fetching transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class PortfolioHistoryPoint(BaseModel):
    month: str
    value: float
    invested: float
    gain: float

class PortfolioHistoryResponse(BaseModel):
    history: List[PortfolioHistoryPoint]
    current_value: float
    total_invested: float
    total_gain: float
    total_gain_percent: float

@router.get("/history", response_model=PortfolioHistoryResponse)
async def get_portfolio_history(
    user_id: str = Query(..., description="User ID")
):
    """
    Get portfolio value history over time based on assets and transactions.
    """
    try:
        from datetime import datetime, timedelta
        from dateutil.relativedelta import relativedelta
        
        # 1. Get user profile for initial investment and monthly budget
        profile_response = supabase_admin.table("user_profiles").select(
            "initial_investment, monthly_budget, created_at"
        ).eq("user_id", user_id).execute()
        
        initial_investment = 0.0
        monthly_budget = 0.0
        account_created = datetime.now()
        
        if profile_response.data:
            profile = profile_response.data[0]
            initial_investment = float(profile.get("initial_investment") or 0)
            monthly_budget = float(profile.get("monthly_budget") or 0)
            account_created = datetime.fromisoformat(profile["created_at"].replace("Z", "+00:00"))
        
        # 2. Get all transactions (closed positions with their dates and P/L)
        tx_response = supabase_admin.table("transactions").select("*").eq("user_id", user_id).execute()
        transactions = tx_response.data or []
        
        # 3. Get current assets
        assets_response = supabase_admin.table("assets").select("*").eq("user_id", user_id).execute()
        current_assets = assets_response.data or []
        
        # Calculate current portfolio value
        current_value = sum(float(a["amount"]) * float(a["price"]) for a in current_assets)
        
        # Add realized gains from transactions
        realized_gains = sum(float(tx.get("profit_loss") or 0) for tx in transactions)
        
        # 4. Build monthly history (last 6 months)
        history = []
        now = datetime.now()
        
        for i in range(5, -1, -1):  # 5 months ago to now
            month_date = now - relativedelta(months=i)
            month_name = month_date.strftime("%b")
            
            # Calculate invested amount up to this month
            months_since_creation = (month_date.year - account_created.year) * 12 + (month_date.month - account_created.month)
            if months_since_creation < 0:
                months_since_creation = 0
            
            invested_at_month = initial_investment + (monthly_budget * max(0, months_since_creation))
            
            # Calculate realized gains up to this month
            month_end = month_date.replace(day=28) + timedelta(days=4)
            month_end = month_end.replace(day=1) - timedelta(days=1)  # Last day of month
            
            realized_up_to_month = 0.0
            for tx in transactions:
                tx_date = datetime.fromisoformat(tx["sale_date"].replace("Z", "+00:00"))
                if tx_date <= month_end.replace(tzinfo=tx_date.tzinfo):
                    realized_up_to_month += float(tx.get("profit_loss") or 0)
            
            # Estimate value at month (simplified: linear interpolation toward current)
            if i == 0:  # Current month
                value_at_month = current_value
            else:
                # Approximate historical value based on invested amount + proportional gains
                progress = (5 - i) / 5
                estimated_unrealized = (current_value - sum(float(a["amount"]) * float(a["price"]) - float(a["amount"]) * float(a["price"]) for a in current_assets)) * progress
                value_at_month = invested_at_month + realized_up_to_month + estimated_unrealized * 0.5
            
            gain_at_month = value_at_month - invested_at_month
            
            history.append(PortfolioHistoryPoint(
                month=month_name,
                value=round(max(0, value_at_month), 2),
                invested=round(invested_at_month, 2),
                gain=round(gain_at_month, 2)
            ))
        
        # Calculate totals
        total_invested = initial_investment
        months_passed = (now.year - account_created.year) * 12 + (now.month - account_created.month)
        if months_passed > 0:
            total_invested += monthly_budget * months_passed
        
        total_gain = (current_value + realized_gains) - total_invested
        total_gain_percent = (total_gain / total_invested * 100) if total_invested > 0 else 0
        
        return PortfolioHistoryResponse(
            history=history,
            current_value=round(current_value, 2),
            total_invested=round(total_invested, 2),
            total_gain=round(total_gain, 2),
            total_gain_percent=round(total_gain_percent, 2)
        )
        
    except Exception as e:
        print(f"Error fetching portfolio history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
