from typing import List, Dict, Any, Optional
from datetime import date, datetime
import logging
import json
import csv
import io

logger = logging.getLogger(__name__)


class ReportsService:
    def __init__(self):
        pass

    async def generate_sales_report(self, format: str, start_date: date, end_date: date,
                                   customer_id: Optional[str] = None,
                                   sales_rep_id: Optional[str] = None,
                                   product_id: Optional[str] = None) -> Any:
        """Generate comprehensive sales report"""
        try:
            from app.services.analytics_service import analytics_service
            
            # Get sales data
            if customer_id:
                data = await analytics_service.get_customer_analytics(customer_id, start_date, end_date)
                title = "Customer Sales Report"
            elif sales_rep_id:
                data = await analytics_service.get_sales_performance(sales_rep_id, start_date, end_date)
                title = "Sales Representative Performance Report"
            else:
                data = await analytics_service.get_sales_dashboard(start_date, end_date)
                title = "Comprehensive Sales Report"
            
            # Prepare report structure
            report_data = {
                "title": title,
                "generated_at": datetime.now().isoformat(),
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "data": data
            }
            
            if format == "json":
                return report_data
            elif format == "csv":
                return self._generate_csv_report(report_data)
            elif format == "excel":
                return self._generate_excel_report(report_data)
            elif format == "pdf":
                return self._generate_pdf_report(report_data)
            
            return report_data

        except Exception as e:
            logger.error(f"Error generating sales report: {e}")
            return {}

    async def generate_revenue_report(self, format: str, period: str, start_date: date, end_date: date) -> Any:
        """Generate revenue report"""
        try:
            from app.services.analytics_service import analytics_service
            
            data = await analytics_service.get_revenue_analytics(period, start_date, end_date)
            
            report_data = {
                "title": f"Revenue Report - {period.title()}",
                "generated_at": datetime.now().isoformat(),
                "period": {
                    "type": period,
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "data": data
            }
            
            if format == "json":
                return report_data
            elif format == "csv":
                return self._generate_csv_report(report_data)
            elif format == "excel":
                return self._generate_excel_report(report_data)
            elif format == "pdf":
                return self._generate_pdf_report(report_data)
            
            return report_data

        except Exception as e:
            logger.error(f"Error generating revenue report: {e}")
            return {}

    async def generate_customer_report(self, format: str, customer_id: Optional[str], 
                                      start_date: date, end_date: date) -> Any:
        """Generate customer report"""
        try:
            from app.services.analytics_service import analytics_service
            
            data = await analytics_service.get_customer_analytics(customer_id, start_date, end_date)
            
            report_data = {
                "title": "Customer Analysis Report",
                "generated_at": datetime.now().isoformat(),
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "data": data
            }
            
            if format == "json":
                return report_data
            elif format == "csv":
                return self._generate_csv_report(report_data)
            elif format == "excel":
                return self._generate_excel_report(report_data)
            elif format == "pdf":
                return self._generate_pdf_report(report_data)
            
            return report_data

        except Exception as e:
            logger.error(f"Error generating customer report: {e}")
            return {}

    async def generate_product_report(self, format: str, product_id: Optional[str], 
                                     category: Optional[str], start_date: date, end_date: date) -> Any:
        """Generate product performance report"""
        try:
            from app.services.analytics_service import analytics_service
            
            data = await analytics_service.get_product_analytics(product_id, category, start_date, end_date)
            
            report_data = {
                "title": "Product Performance Report",
                "generated_at": datetime.now().isoformat(),
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "filters": {
                    "product_id": product_id,
                    "category": category
                },
                "data": data
            }
            
            if format == "json":
                return report_data
            elif format == "csv":
                return self._generate_csv_report(report_data)
            elif format == "excel":
                return self._generate_excel_report(report_data)
            elif format == "pdf":
                return self._generate_pdf_report(report_data)
            
            return report_data

        except Exception as e:
            logger.error(f"Error generating product report: {e}")
            return {}

    async def generate_aging_report(self, format: str, report_type: str, as_of_date: date) -> Any:
        """Generate aging report for receivables/payables"""
        try:
            from app.database import get_database
            
            db = get_database()
            invoices_collection = db.invoices
            
            # Calculate aging buckets
            aging_buckets = {
                "current": 0,
                "1-30_days": 0,
                "31-60_days": 0,
                "61-90_days": 0,
                "over_90_days": 0
            }
            
            # Get overdue invoices
            pipeline = [
                {
                    "$match": {
                        "due_date": {"$lte": as_of_date},
                        "payment_status": {"$ne": "paid"}
                    }
                },
                {
                    "$project": {
                        "invoice_number": 1,
                        "customer_name": 1,
                        "due_date": 1,
                        "balance_due": 1,
                        "days_overdue": {
                            "$dateDiff": {
                                "startDate": "$due_date",
                                "endDate": as_of_date,
                                "unit": "day"
                            }
                        }
                    }
                }
            ]
            
            invoices = await invoices_collection.aggregate(pipeline).to_list(length=None)
            
            # Categorize by aging bucket
            detailed_aging = []
            for invoice in invoices:
                days_overdue = invoice["days_overdue"]
                balance = invoice["balance_due"]
                
                if days_overdue <= 0:
                    aging_buckets["current"] += balance
                    bucket = "Current"
                elif days_overdue <= 30:
                    aging_buckets["1-30_days"] += balance
                    bucket = "1-30 Days"
                elif days_overdue <= 60:
                    aging_buckets["31-60_days"] += balance
                    bucket = "31-60 Days"
                elif days_overdue <= 90:
                    aging_buckets["61-90_days"] += balance
                    bucket = "61-90 Days"
                else:
                    aging_buckets["over_90_days"] += balance
                    bucket = "Over 90 Days"
                
                detailed_aging.append({
                    "invoice_number": invoice["invoice_number"],
                    "customer_name": invoice["customer_name"],
                    "due_date": invoice["due_date"].isoformat(),
                    "days_overdue": days_overdue,
                    "balance_due": balance,
                    "aging_bucket": bucket
                })
            
            report_data = {
                "title": f"{report_type.title()} Aging Report",
                "generated_at": datetime.now().isoformat(),
                "as_of_date": as_of_date.isoformat(),
                "summary": aging_buckets,
                "details": detailed_aging,
                "total_outstanding": sum(aging_buckets.values())
            }
            
            if format == "json":
                return report_data
            elif format == "csv":
                return self._generate_csv_report(report_data)
            elif format == "excel":
                return self._generate_excel_report(report_data)
            elif format == "pdf":
                return self._generate_pdf_report(report_data)
            
            return report_data

        except Exception as e:
            logger.error(f"Error generating aging report: {e}")
            return {}

    async def generate_commission_report(self, format: str, sales_rep_id: Optional[str], 
                                        start_date: date, end_date: date) -> Any:
        """Generate sales commission report"""
        try:
            from app.services.analytics_service import analytics_service
            
            # Get sales performance data
            performance_data = await analytics_service.get_sales_performance(sales_rep_id, start_date, end_date)
            
            # Calculate commission (assuming 5% commission rate)
            commission_rate = 0.05
            commission_data = []
            
            for rep in performance_data.get("sales_reps", []):
                commission_amount = rep["total_revenue"] * commission_rate
                commission_data.append({
                    "sales_rep_id": rep["sales_rep_id"],
                    "sales_rep_name": rep["sales_rep_name"],
                    "total_revenue": rep["total_revenue"],
                    "commission_rate": commission_rate,
                    "commission_amount": commission_amount,
                    "total_orders": rep["total_orders"],
                    "unique_customers": rep["unique_customers"]
                })
            
            report_data = {
                "title": "Sales Commission Report",
                "generated_at": datetime.now().isoformat(),
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "commission_rate": commission_rate,
                "data": commission_data,
                "total_commission": sum(item["commission_amount"] for item in commission_data)
            }
            
            if format == "json":
                return report_data
            elif format == "csv":
                return self._generate_csv_report(report_data)
            elif format == "excel":
                return self._generate_excel_report(report_data)
            elif format == "pdf":
                return self._generate_pdf_report(report_data)
            
            return report_data

        except Exception as e:
            logger.error(f"Error generating commission report: {e}")
            return {}

    async def get_report_templates(self) -> List[Dict[str, Any]]:
        """Get available report templates"""
        try:
            templates = [
                {
                    "id": "sales_summary",
                    "name": "Sales Summary Report",
                    "description": "Overview of sales performance with key metrics",
                    "parameters": ["start_date", "end_date", "customer_id", "sales_rep_id"]
                },
                {
                    "id": "revenue_analysis",
                    "name": "Revenue Analysis Report",
                    "description": "Detailed revenue breakdown by period",
                    "parameters": ["start_date", "end_date", "period"]
                },
                {
                    "id": "customer_performance",
                    "name": "Customer Performance Report",
                    "description": "Customer purchase history and analytics",
                    "parameters": ["start_date", "end_date", "customer_id"]
                },
                {
                    "id": "product_performance",
                    "name": "Product Performance Report",
                    "description": "Product sales analytics and trends",
                    "parameters": ["start_date", "end_date", "product_id", "category"]
                },
                {
                    "id": "sales_forecast",
                    "name": "Sales Forecast Report",
                    "description": "AI-powered sales predictions",
                    "parameters": ["months_ahead", "metric"]
                }
            ]
            
            return templates

        except Exception as e:
            logger.error(f"Error getting report templates: {e}")
            return []

    async def generate_custom_report(self, template_id: str, parameters: Dict[str, Any], format: str) -> Any:
        """Generate custom report using template"""
        try:
            from app.services.analytics_service import analytics_service
            
            if template_id == "sales_summary":
                data = await analytics_service.get_sales_dashboard(
                    parameters.get("start_date"), 
                    parameters.get("end_date")
                )
            elif template_id == "revenue_analysis":
                data = await analytics_service.get_revenue_analytics(
                    parameters.get("period", "monthly"),
                    parameters.get("start_date"),
                    parameters.get("end_date")
                )
            elif template_id == "customer_performance":
                data = await analytics_service.get_customer_analytics(
                    parameters.get("customer_id"),
                    parameters.get("start_date"),
                    parameters.get("end_date")
                )
            elif template_id == "product_performance":
                data = await analytics_service.get_product_analytics(
                    parameters.get("product_id"),
                    parameters.get("category"),
                    parameters.get("start_date"),
                    parameters.get("end_date")
                )
            elif template_id == "sales_forecast":
                data = await analytics_service.get_sales_forecast(
                    parameters.get("months_ahead", 3),
                    parameters.get("metric", "revenue")
                )
            else:
                raise ValueError(f"Unknown template: {template_id}")
            
            report_data = {
                "title": f"Custom Report - {template_id}",
                "template_id": template_id,
                "generated_at": datetime.now().isoformat(),
                "parameters": parameters,
                "data": data
            }
            
            if format == "json":
                return report_data
            elif format == "csv":
                return self._generate_csv_report(report_data)
            elif format == "excel":
                return self._generate_excel_report(report_data)
            elif format == "pdf":
                return self._generate_pdf_report(report_data)
            
            return report_data

        except Exception as e:
            logger.error(f"Error generating custom report: {e}")
            return {}

    def _generate_csv_report(self, data: Dict[str, Any]) -> bytes:
        """Generate CSV format report"""
        try:
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow([data.get("title", "Report")])
            writer.writerow([f"Generated: {data.get('generated_at', '')}"])
            writer.writerow([])  # Empty row
            
            # Write data (simplified - would need more sophisticated logic for complex data)
            if isinstance(data.get("data"), dict):
                for key, value in data["data"].items():
                    if isinstance(value, (int, float, str)):
                        writer.writerow([key, value])
            
            return output.getvalue().encode('utf-8')

        except Exception as e:
            logger.error(f"Error generating CSV report: {e}")
            return b"Error generating CSV report"

    def _generate_excel_report(self, data: Dict[str, Any]) -> bytes:
        """Generate Excel format report"""
        try:
            # This would require openpyxl or similar library
            # For now, return placeholder
            return b"Excel report would be generated here with openpyxl"

        except Exception as e:
            logger.error(f"Error generating Excel report: {e}")
            return b"Error generating Excel report"

    def _generate_pdf_report(self, data: Dict[str, Any]) -> bytes:
        """Generate PDF format report"""
        try:
            # This would require reportlab or similar library
            # For now, return placeholder
            return b"PDF report would be generated here with reportlab"

        except Exception as e:
            logger.error(f"Error generating PDF report: {e}")
            return b"Error generating PDF report"


# Global instance
reports_service = ReportsService()
