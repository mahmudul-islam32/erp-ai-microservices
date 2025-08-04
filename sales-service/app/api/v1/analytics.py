from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.services import analytics_service
from app.api.dependencies import get_current_active_user, require_sales_access
from typing import Optional
from datetime import date, datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_sales_dashboard(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Get sales dashboard analytics"""
    try:
        if not start_date:
            start_date = date.today().replace(day=1)  # First day of current month
        if not end_date:
            end_date = date.today()

        dashboard_data = await analytics_service.get_sales_dashboard(start_date, end_date)
        return dashboard_data
    except Exception as e:
        logger.error(f"Get sales dashboard error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/revenue")
async def get_revenue_analytics(
    period: str = Query("monthly", regex="^(daily|weekly|monthly|quarterly|yearly)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Get revenue analytics by period"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        revenue_data = await analytics_service.get_revenue_analytics(period, start_date, end_date)
        return revenue_data
    except Exception as e:
        logger.error(f"Get revenue analytics error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/sales-performance")
async def get_sales_performance(
    sales_rep_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Get sales representative performance analytics"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        performance_data = await analytics_service.get_sales_performance(
            sales_rep_id, start_date, end_date
        )
        return performance_data
    except Exception as e:
        logger.error(f"Get sales performance error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/customer-analytics")
async def get_customer_analytics(
    customer_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Get customer analytics"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        customer_data = await analytics_service.get_customer_analytics(
            customer_id, start_date, end_date
        )
        return customer_data
    except Exception as e:
        logger.error(f"Get customer analytics error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/product-analytics")
async def get_product_analytics(
    product_id: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Get product sales analytics"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        product_data = await analytics_service.get_product_analytics(
            product_id, category, start_date, end_date
        )
        return product_data
    except Exception as e:
        logger.error(f"Get product analytics error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/conversion-funnel")
async def get_conversion_funnel(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Get sales conversion funnel analytics"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        funnel_data = await analytics_service.get_conversion_funnel(start_date, end_date)
        return funnel_data
    except Exception as e:
        logger.error(f"Get conversion funnel error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/top-customers")
async def get_top_customers(
    limit: int = Query(10, ge=1, le=100),
    period: str = Query("monthly", regex="^(monthly|quarterly|yearly)$"),
    current_user=Depends(require_sales_access())
):
    """Get top customers by revenue"""
    try:
        customers_data = await analytics_service.get_top_customers(limit, period)
        return customers_data
    except Exception as e:
        logger.error(f"Get top customers error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/top-products")
async def get_top_products(
    limit: int = Query(10, ge=1, le=100),
    metric: str = Query("revenue", regex="^(revenue|quantity|profit)$"),
    period: str = Query("monthly", regex="^(monthly|quarterly|yearly)$"),
    current_user=Depends(require_sales_access())
):
    """Get top products by revenue, quantity, or profit"""
    try:
        products_data = await analytics_service.get_top_products(limit, metric, period)
        return products_data
    except Exception as e:
        logger.error(f"Get top products error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/trends")
async def get_sales_trends(
    metric: str = Query("revenue", regex="^(revenue|orders|customers)$"),
    period: str = Query("monthly", regex="^(daily|weekly|monthly)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Get sales trends over time"""
    try:
        if not start_date:
            # Default to last 12 months
            from datetime import timedelta
            end_date = date.today()
            start_date = end_date - timedelta(days=365)
        if not end_date:
            end_date = date.today()

        trends_data = await analytics_service.get_sales_trends(metric, period, start_date, end_date)
        return trends_data
    except Exception as e:
        logger.error(f"Get sales trends error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/forecast")
async def get_sales_forecast(
    months_ahead: int = Query(3, ge=1, le=12),
    metric: str = Query("revenue", regex="^(revenue|orders)$"),
    current_user=Depends(require_sales_access())
):
    """Get sales forecast using AI/ML models"""
    try:
        forecast_data = await analytics_service.get_sales_forecast(months_ahead, metric)
        return forecast_data
    except Exception as e:
        logger.error(f"Get sales forecast error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/kpis")
async def get_sales_kpis(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Get key performance indicators (KPIs)"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        kpis_data = await analytics_service.get_sales_kpis(start_date, end_date)
        return kpis_data
    except Exception as e:
        logger.error(f"Get sales KPIs error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
