from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
import yfinance as yf
from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

router = APIRouter(
    prefix="/analytics",
    tags=["Portfolio Analytics"]
)

class AssetAnalysis(BaseModel):
    symbol: str
    name: str
    sector: Optional[str]
    weight: float
    value: float
    profit_loss: float
    profit_loss_percent: float

class SectorBreakdown(BaseModel):
    sector: str
    weight: float
    value: float
    count: int

class RiskMetrics(BaseModel):
    diversification_score: float  # 0-100
    concentration_risk: str  # Low/Medium/High
    top_holding_weight: float
    sector_count: int
    asset_count: int

class PortfolioAnalysisResponse(BaseModel):
    summary: str
    total_value: float
    total_invested: float
    total_gain: float
    total_gain_percent: float
    assets: List[AssetAnalysis]
    sectors: List[SectorBreakdown]
    risk_metrics: RiskMetrics
    recommendations: List[str]
    detailed_analysis: str

@router.get("/portfolio", response_model=PortfolioAnalysisResponse)
async def analyze_portfolio(user_id: str = Query(..., description="User ID")):
    """
    Generate a comprehensive portfolio analysis with sector breakdown,
    risk metrics, and personalized recommendations.
    """
    try:
        # 1. Fetch user's assets
        assets_response = supabase_admin.table("assets").select("*").eq("user_id", user_id).execute()
        
        if not assets_response.data or len(assets_response.data) == 0:
            raise HTTPException(status_code=404, detail="No assets found in portfolio")
        
        raw_assets = assets_response.data
        
        # 2. Fetch sector info for each asset using yfinance
        assets_analysis = []
        sector_map = {}
        total_value = 0
        total_invested = 0
        
        for asset in raw_assets:
            symbol = asset["symbol"]
            amount = float(asset["amount"])
            purchase_price = float(asset["price"])
            
            # Get current price and sector info
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                current_price = info.get("currentPrice") or info.get("regularMarketPrice") or purchase_price
                sector = info.get("sector", "Other")
            except:
                current_price = purchase_price
                sector = "Other"
            
            value = amount * current_price
            cost = amount * purchase_price
            profit_loss = value - cost
            profit_loss_percent = (profit_loss / cost * 100) if cost > 0 else 0
            
            total_value += value
            total_invested += cost
            
            assets_analysis.append({
                "symbol": symbol,
                "name": asset["name"],
                "sector": sector,
                "value": value,
                "cost": cost,
                "profit_loss": profit_loss,
                "profit_loss_percent": profit_loss_percent
            })
            
            # Aggregate by sector
            if sector not in sector_map:
                sector_map[sector] = {"value": 0, "count": 0}
            sector_map[sector]["value"] += value
            sector_map[sector]["count"] += 1
        
        # 3. Calculate weights and build response objects
        assets_with_weight = []
        for a in assets_analysis:
            weight = (a["value"] / total_value * 100) if total_value > 0 else 0
            assets_with_weight.append(AssetAnalysis(
                symbol=a["symbol"],
                name=a["name"],
                sector=a["sector"],
                weight=round(weight, 1),
                value=round(a["value"], 2),
                profit_loss=round(a["profit_loss"], 2),
                profit_loss_percent=round(a["profit_loss_percent"], 2)
            ))
        
        # Sort by weight descending
        assets_with_weight.sort(key=lambda x: x.weight, reverse=True)
        
        # 4. Build sector breakdown
        sectors = []
        for sector, data in sector_map.items():
            weight = (data["value"] / total_value * 100) if total_value > 0 else 0
            sectors.append(SectorBreakdown(
                sector=sector,
                weight=round(weight, 1),
                value=round(data["value"], 2),
                count=data["count"]
            ))
        sectors.sort(key=lambda x: x.weight, reverse=True)
        
        # 5. Calculate risk metrics
        top_holding_weight = assets_with_weight[0].weight if assets_with_weight else 0
        
        # Diversification score (higher is better)
        # Based on number of assets, sectors, and concentration
        asset_score = min(len(assets_with_weight) * 10, 40)  # Max 40 points for 4+ assets
        sector_score = min(len(sectors) * 15, 30)  # Max 30 points for 2+ sectors
        concentration_score = max(0, 30 - top_holding_weight)  # Lower concentration = higher score
        diversification_score = asset_score + sector_score + concentration_score
        
        if top_holding_weight > 50:
            concentration_risk = "High"
        elif top_holding_weight > 30:
            concentration_risk = "Medium"
        else:
            concentration_risk = "Low"
        
        risk_metrics = RiskMetrics(
            diversification_score=round(min(diversification_score, 100), 0),
            concentration_risk=concentration_risk,
            top_holding_weight=round(top_holding_weight, 1),
            sector_count=len(sectors),
            asset_count=len(assets_with_weight)
        )
        
        # 6. Generate recommendations
        recommendations = []
        if len(assets_with_weight) < 5:
            recommendations.append("Consider adding more assets to improve diversification. A well-diversified portfolio typically has 10-15 positions.")
        if len(sectors) < 3:
            recommendations.append("Your portfolio is concentrated in few sectors. Consider adding exposure to other sectors like Healthcare, Technology, or Consumer Staples.")
        if top_holding_weight > 30:
            recommendations.append(f"Your top holding ({assets_with_weight[0].symbol}) represents {top_holding_weight:.1f}% of your portfolio. Consider rebalancing to reduce concentration risk.")
        
        total_gain = total_value - total_invested
        total_gain_percent = (total_gain / total_invested * 100) if total_invested > 0 else 0
        
        if total_gain_percent > 20:
            recommendations.append("Excellent returns! Consider taking some profits to lock in gains and rebalance your portfolio.")
        elif total_gain_percent < -10:
            recommendations.append("Your portfolio is down significantly. Review your holdings and consider if your investment thesis still holds. This might be an opportunity to add to positions at lower prices if fundamentals are strong.")
        
        if not recommendations:
            recommendations.append("Your portfolio looks well-balanced! Continue monitoring and consider regular rebalancing every 6-12 months.")
        
        # 7. Generate detailed analysis text
        summary = f"Your portfolio of {len(assets_with_weight)} assets is valued at ${total_value:,.2f}"
        
        detailed_analysis = generate_detailed_analysis(
            assets_with_weight, 
            sectors, 
            risk_metrics, 
            total_value, 
            total_invested,
            total_gain,
            total_gain_percent
        )
        
        return PortfolioAnalysisResponse(
            summary=summary,
            total_value=round(total_value, 2),
            total_invested=round(total_invested, 2),
            total_gain=round(total_gain, 2),
            total_gain_percent=round(total_gain_percent, 2),
            assets=assets_with_weight,
            sectors=sectors,
            risk_metrics=risk_metrics,
            recommendations=recommendations,
            detailed_analysis=detailed_analysis
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing portfolio: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def generate_detailed_analysis(assets, sectors, risk_metrics, total_value, total_invested, total_gain, total_gain_percent):
    """Generate a detailed, human-readable analysis of the portfolio."""
    
    lines = []
    
    # Opening
    lines.append("## 📊 Portfolio Analysis Report\n")
    lines.append(f"Based on our comprehensive analysis of your investment portfolio, here's what we found:\n")
    
    # Performance Overview
    lines.append("### 💰 Performance Overview\n")
    if total_gain >= 0:
        lines.append(f"Your portfolio is performing well with a total gain of **${total_gain:,.2f}** ({total_gain_percent:+.2f}%). ")
        if total_gain_percent > 15:
            lines.append("This is an excellent return that outpaces many market benchmarks. ")
        elif total_gain_percent > 5:
            lines.append("This represents solid growth aligned with long-term market averages. ")
    else:
        lines.append(f"Your portfolio is currently showing an unrealized loss of **${abs(total_gain):,.2f}** ({total_gain_percent:.2f}%). ")
        lines.append("Market fluctuations are normal - stay focused on your long-term investment goals. ")
    
    lines.append(f"\nYou've invested a total of **${total_invested:,.2f}** across **{len(assets)} positions**.\n")
    
    # Top Holdings
    lines.append("### 🏆 Top Holdings\n")
    top_3 = assets[:3]
    for i, asset in enumerate(top_3, 1):
        emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉"
        gain_text = f"+{asset.profit_loss_percent:.1f}%" if asset.profit_loss >= 0 else f"{asset.profit_loss_percent:.1f}%"
        lines.append(f"{emoji} **{asset.symbol}** - {asset.weight}% of portfolio ({gain_text})\n")
    
    # Sector Analysis
    lines.append("\n### 📈 Sector Breakdown\n")
    if len(sectors) == 1:
        lines.append(f"Your portfolio is concentrated in a single sector: **{sectors[0].sector}**. ")
        lines.append("While this can lead to strong returns if the sector performs well, it also increases risk. Consider diversifying across multiple sectors.\n")
    else:
        lines.append(f"Your investments are spread across **{len(sectors)} sectors**:\n")
        for sector in sectors:
            bar = "█" * int(sector.weight / 5)
            lines.append(f"- **{sector.sector}**: {sector.weight}% {bar}\n")
    
    # Risk Assessment
    lines.append("\n### ⚠️ Risk Assessment\n")
    score = risk_metrics.diversification_score
    if score >= 70:
        lines.append(f"**Diversification Score: {score}/100** - Excellent! ")
        lines.append("Your portfolio demonstrates good diversification principles. ")
    elif score >= 50:
        lines.append(f"**Diversification Score: {score}/100** - Moderate. ")
        lines.append("There's room for improvement in portfolio diversification. ")
    else:
        lines.append(f"**Diversification Score: {score}/100** - Needs Attention. ")
        lines.append("Your portfolio has significant concentration risk. ")
    
    if risk_metrics.concentration_risk == "High":
        lines.append(f"\n⚠️ **Concentration Warning**: Your top holding represents {risk_metrics.top_holding_weight}% of your portfolio. A sudden drop in this stock could significantly impact your overall returns.\n")
    
    # Closing
    lines.append("\n### 💡 Summary\n")
    lines.append("Remember that investing is a marathon, not a sprint. ")
    lines.append("Regular portfolio reviews and rebalancing are key to long-term success. ")
    lines.append("Consider your risk tolerance and investment timeline when making decisions.\n")
    
    return "".join(lines)
