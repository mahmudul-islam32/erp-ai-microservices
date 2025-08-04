from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.services import reports_service
from app.api.dependencies import get_current_active_user, require_sales_access
from typing import Optional, List
from datetime import date
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/sales")
async def generate_sales_report(
    format: str = Query("json", regex="^(json|pdf|csv|excel)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    customer_id: Optional[str] = None,
    sales_rep_id: Optional[str] = None,
    product_id: Optional[str] = None,
    current_user=Depends(require_sales_access())
):
    """Generate comprehensive sales report"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        report_data = await reports_service.generate_sales_report(
            format=format,
            start_date=start_date,
            end_date=end_date,
            customer_id=customer_id,
            sales_rep_id=sales_rep_id,
            product_id=product_id
        )

        if format == "json":
            return report_data
        else:
            # Return file response for other formats
            from fastapi.responses import Response
            content_types = {
                "pdf": "application/pdf",
                "csv": "text/csv",
                "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
            file_extensions = {
                "pdf": "pdf",
                "csv": "csv", 
                "excel": "xlsx"
            }
            
            return Response(
                content=report_data,
                media_type=content_types[format],
                headers={
                    "Content-Disposition": f"attachment; filename=sales-report.{file_extensions[format]}"
                }
            )

    except Exception as e:
        logger.error(f"Generate sales report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/revenue")
async def generate_revenue_report(
    format: str = Query("json", regex="^(json|pdf|csv|excel)$"),
    period: str = Query("monthly", regex="^(daily|weekly|monthly|quarterly|yearly)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Generate revenue report"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        report_data = await reports_service.generate_revenue_report(
            format=format,
            period=period,
            start_date=start_date,
            end_date=end_date
        )

        if format == "json":
            return report_data
        else:
            from fastapi.responses import Response
            content_types = {
                "pdf": "application/pdf",
                "csv": "text/csv",
                "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
            file_extensions = {
                "pdf": "pdf",
                "csv": "csv",
                "excel": "xlsx"
            }
            
            return Response(
                content=report_data,
                media_type=content_types[format],
                headers={
                    "Content-Disposition": f"attachment; filename=revenue-report.{file_extensions[format]}"
                }
            )

    except Exception as e:
        logger.error(f"Generate revenue report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/customer")
async def generate_customer_report(
    format: str = Query("json", regex="^(json|pdf|csv|excel)$"),
    customer_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Generate customer report"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        report_data = await reports_service.generate_customer_report(
            format=format,
            customer_id=customer_id,
            start_date=start_date,
            end_date=end_date
        )

        if format == "json":
            return report_data
        else:
            from fastapi.responses import Response
            content_types = {
                "pdf": "application/pdf",
                "csv": "text/csv",
                "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
            file_extensions = {
                "pdf": "pdf",
                "csv": "csv",
                "excel": "xlsx"
            }
            
            return Response(
                content=report_data,
                media_type=content_types[format],
                headers={
                    "Content-Disposition": f"attachment; filename=customer-report.{file_extensions[format]}"
                }
            )

    except Exception as e:
        logger.error(f"Generate customer report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/product")
async def generate_product_report(
    format: str = Query("json", regex="^(json|pdf|csv|excel)$"),
    product_id: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Generate product performance report"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        report_data = await reports_service.generate_product_report(
            format=format,
            product_id=product_id,
            category=category,
            start_date=start_date,
            end_date=end_date
        )

        if format == "json":
            return report_data
        else:
            from fastapi.responses import Response
            content_types = {
                "pdf": "application/pdf",
                "csv": "text/csv",
                "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
            file_extensions = {
                "pdf": "pdf",
                "csv": "csv",
                "excel": "xlsx"
            }
            
            return Response(
                content=report_data,
                media_type=content_types[format],
                headers={
                    "Content-Disposition": f"attachment; filename=product-report.{file_extensions[format]}"
                }
            )

    except Exception as e:
        logger.error(f"Generate product report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/aging")
async def generate_aging_report(
    format: str = Query("json", regex="^(json|pdf|csv|excel)$"),
    report_type: str = Query("receivables", regex="^(receivables|payables)$"),
    as_of_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Generate aging report for receivables/payables"""
    try:
        if not as_of_date:
            as_of_date = date.today()

        report_data = await reports_service.generate_aging_report(
            format=format,
            report_type=report_type,
            as_of_date=as_of_date
        )

        if format == "json":
            return report_data
        else:
            from fastapi.responses import Response
            content_types = {
                "pdf": "application/pdf",
                "csv": "text/csv",
                "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
            file_extensions = {
                "pdf": "pdf",
                "csv": "csv",
                "excel": "xlsx"
            }
            
            return Response(
                content=report_data,
                media_type=content_types[format],
                headers={
                    "Content-Disposition": f"attachment; filename={report_type}-aging-report.{file_extensions[format]}"
                }
            )

    except Exception as e:
        logger.error(f"Generate aging report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/commission")
async def generate_commission_report(
    format: str = Query("json", regex="^(json|pdf|csv|excel)$"),
    sales_rep_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user=Depends(require_sales_access())
):
    """Generate sales commission report"""
    try:
        if not start_date:
            start_date = date.today().replace(month=1, day=1)  # First day of current year
        if not end_date:
            end_date = date.today()

        report_data = await reports_service.generate_commission_report(
            format=format,
            sales_rep_id=sales_rep_id,
            start_date=start_date,
            end_date=end_date
        )

        if format == "json":
            return report_data
        else:
            from fastapi.responses import Response
            content_types = {
                "pdf": "application/pdf",
                "csv": "text/csv",
                "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
            file_extensions = {
                "pdf": "pdf",
                "csv": "csv",
                "excel": "xlsx"
            }
            
            return Response(
                content=report_data,
                media_type=content_types[format],
                headers={
                    "Content-Disposition": f"attachment; filename=commission-report.{file_extensions[format]}"
                }
            )

    except Exception as e:
        logger.error(f"Generate commission report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/templates")
async def get_report_templates(
    current_user=Depends(require_sales_access())
):
    """Get available report templates"""
    try:
        templates = await reports_service.get_report_templates()
        return {"templates": templates}
    except Exception as e:
        logger.error(f"Get report templates error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/custom")
async def generate_custom_report(
    template_id: str,
    parameters: dict,
    format: str = Query("json", regex="^(json|pdf|csv|excel)$"),
    current_user=Depends(require_sales_access())
):
    """Generate custom report using template"""
    try:
        report_data = await reports_service.generate_custom_report(
            template_id=template_id,
            parameters=parameters,
            format=format
        )

        if format == "json":
            return report_data
        else:
            from fastapi.responses import Response
            content_types = {
                "pdf": "application/pdf",
                "csv": "text/csv",
                "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
            file_extensions = {
                "pdf": "pdf",
                "csv": "csv",
                "excel": "xlsx"
            }
            
            return Response(
                content=report_data,
                media_type=content_types[format],
                headers={
                    "Content-Disposition": f"attachment; filename=custom-report.{file_extensions[format]}"
                }
            )

    except Exception as e:
        logger.error(f"Generate custom report error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
