from app.database import get_database
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(self):
        pass

    async def get_sales_dashboard(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Get sales dashboard analytics"""
        try:
            db = get_database()
            
            # Get key metrics
            total_revenue = await self._get_total_revenue(start_date, end_date)
            total_orders = await self._get_total_orders(start_date, end_date)
            total_customers = await self._get_total_customers(start_date, end_date)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            
            # Get previous period for comparison
            period_days = (end_date - start_date).days
            prev_start_date = start_date - timedelta(days=period_days)
            prev_end_date = start_date
            
            prev_revenue = await self._get_total_revenue(prev_start_date, prev_end_date)
            prev_orders = await self._get_total_orders(prev_start_date, prev_end_date)
            
            # Calculate growth rates
            revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
            orders_growth = ((total_orders - prev_orders) / prev_orders * 100) if prev_orders > 0 else 0
            
            # Get top products and customers
            top_products = await self._get_top_products_by_revenue(5, start_date, end_date)
            top_customers = await self._get_top_customers_by_revenue(5, start_date, end_date)
            
            # Get sales trends (daily)
            sales_trends = await self._get_daily_sales_trends(start_date, end_date)
            
            return {
                "summary": {
                    "total_revenue": total_revenue,
                    "total_orders": total_orders,
                    "total_customers": total_customers,
                    "avg_order_value": avg_order_value,
                    "revenue_growth": revenue_growth,
                    "orders_growth": orders_growth
                },
                "top_products": top_products,
                "top_customers": top_customers,
                "sales_trends": sales_trends,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting sales dashboard: {e}")
            return {}

    async def get_revenue_analytics(self, period: str, start_date: date, end_date: date) -> Dict[str, Any]:
        """Get revenue analytics by period"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            # Define grouping based on period
            group_format = {
                "daily": {"$dateToString": {"format": "%Y-%m-%d", "date": "$order_date"}},
                "weekly": {"$dateToString": {"format": "%Y-W%U", "date": "$order_date"}},
                "monthly": {"$dateToString": {"format": "%Y-%m", "date": "$order_date"}},
                "quarterly": {"$concat": [
                    {"$toString": {"$year": "$order_date"}},
                    "-Q",
                    {"$toString": {"$ceil": {"$divide": [{"$month": "$order_date"}, 3]}}}
                ]},
                "yearly": {"$dateToString": {"format": "%Y", "date": "$order_date"}}
            }
            
            pipeline = [
                {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
                    }
                },
                {
                    "$group": {
                        "_id": group_format.get(period, group_format["monthly"]),
                        "revenue": {"$sum": "$total_amount"},
                        "orders": {"$sum": 1},
                        "avg_order_value": {"$avg": "$total_amount"}
                    }
                },
                {"$sort": {"_id": 1}}
            ]
            
            results = await orders_collection.aggregate(pipeline).to_list(length=None)
            
            return {
                "period": period,
                "data": results,
                "summary": {
                    "total_revenue": sum(r["revenue"] for r in results),
                    "total_orders": sum(r["orders"] for r in results),
                    "avg_order_value": sum(r["avg_order_value"] for r in results) / len(results) if results else 0
                }
            }

        except Exception as e:
            logger.error(f"Error getting revenue analytics: {e}")
            return {}

    async def get_sales_performance(self, sales_rep_id: Optional[str], start_date: date, end_date: date) -> Dict[str, Any]:
        """Get sales representative performance analytics"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            match_filter = {
                "order_date": {"$gte": start_date, "$lte": end_date},
                "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
            }
            
            if sales_rep_id:
                match_filter["sales_rep_id"] = sales_rep_id
            
            pipeline = [
                {"$match": match_filter},
                {
                    "$group": {
                        "_id": {
                            "sales_rep_id": "$sales_rep_id",
                            "sales_rep_name": "$sales_rep_name"
                        },
                        "total_revenue": {"$sum": "$total_amount"},
                        "total_orders": {"$sum": 1},
                        "avg_order_value": {"$avg": "$total_amount"},
                        "customers": {"$addToSet": "$customer_id"}
                    }
                },
                {
                    "$project": {
                        "sales_rep_id": "$_id.sales_rep_id",
                        "sales_rep_name": "$_id.sales_rep_name",
                        "total_revenue": 1,
                        "total_orders": 1,
                        "avg_order_value": 1,
                        "unique_customers": {"$size": "$customers"}
                    }
                },
                {"$sort": {"total_revenue": -1}}
            ]
            
            results = await orders_collection.aggregate(pipeline).to_list(length=None)
            
            return {
                "sales_reps": results,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting sales performance: {e}")
            return {}

    async def get_customer_analytics(self, customer_id: Optional[str], start_date: date, end_date: date) -> Dict[str, Any]:
        """Get customer analytics"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            match_filter = {
                "order_date": {"$gte": start_date, "$lte": end_date},
                "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
            }
            
            if customer_id:
                match_filter["customer_id"] = customer_id
            
            # Customer analysis
            pipeline = [
                {"$match": match_filter},
                {
                    "$group": {
                        "_id": {
                            "customer_id": "$customer_id",
                            "customer_name": "$customer_name",
                            "customer_email": "$customer_email"
                        },
                        "total_revenue": {"$sum": "$total_amount"},
                        "total_orders": {"$sum": 1},
                        "avg_order_value": {"$avg": "$total_amount"},
                        "first_order": {"$min": "$order_date"},
                        "last_order": {"$max": "$order_date"}
                    }
                },
                {
                    "$project": {
                        "customer_id": "$_id.customer_id",
                        "customer_name": "$_id.customer_name",
                        "customer_email": "$_id.customer_email",
                        "total_revenue": 1,
                        "total_orders": 1,
                        "avg_order_value": 1,
                        "first_order": 1,
                        "last_order": 1,
                        "customer_lifetime_days": {
                            "$dateDiff": {
                                "startDate": "$first_order",
                                "endDate": "$last_order",
                                "unit": "day"
                            }
                        }
                    }
                },
                {"$sort": {"total_revenue": -1}}
            ]
            
            results = await orders_collection.aggregate(pipeline).to_list(length=None)
            
            return {
                "customers": results,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting customer analytics: {e}")
            return {}

    async def get_product_analytics(self, product_id: Optional[str], category: Optional[str], 
                                   start_date: date, end_date: date) -> Dict[str, Any]:
        """Get product sales analytics"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            # Unwind line items to analyze products
            pipeline = [
                {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
                    }
                },
                {"$unwind": "$line_items"},
                {
                    "$group": {
                        "_id": {
                            "product_id": "$line_items.product_id",
                            "product_name": "$line_items.product_name",
                            "product_sku": "$line_items.product_sku"
                        },
                        "total_revenue": {"$sum": "$line_items.line_total"},
                        "total_quantity": {"$sum": "$line_items.quantity"},
                        "total_orders": {"$sum": 1},
                        "avg_price": {"$avg": "$line_items.unit_price"}
                    }
                },
                {
                    "$project": {
                        "product_id": "$_id.product_id",
                        "product_name": "$_id.product_name",
                        "product_sku": "$_id.product_sku",
                        "total_revenue": 1,
                        "total_quantity": 1,
                        "total_orders": 1,
                        "avg_price": 1
                    }
                },
                {"$sort": {"total_revenue": -1}}
            ]
            
            # Add product filter if specified
            if product_id:
                pipeline[1] = {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]},
                        "line_items.product_id": product_id
                    }
                }
            
            results = await orders_collection.aggregate(pipeline).to_list(length=None)
            
            return {
                "products": results,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting product analytics: {e}")
            return {}

    async def get_conversion_funnel(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Get sales conversion funnel analytics"""
        try:
            db = get_database()
            quotes_collection = db.quotes
            orders_collection = db.sales_orders
            invoices_collection = db.invoices
            
            # Count quotes
            quotes_count = await quotes_collection.count_documents({
                "quote_date": {"$gte": start_date, "$lte": end_date}
            })
            
            # Count accepted quotes
            accepted_quotes = await quotes_collection.count_documents({
                "quote_date": {"$gte": start_date, "$lte": end_date},
                "status": "accepted"
            })
            
            # Count orders
            orders_count = await orders_collection.count_documents({
                "order_date": {"$gte": start_date, "$lte": end_date},
                "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
            })
            
            # Count paid invoices
            paid_invoices = await invoices_collection.count_documents({
                "invoice_date": {"$gte": start_date, "$lte": end_date},
                "payment_status": "paid"
            })
            
            # Calculate conversion rates
            quote_to_order = (accepted_quotes / quotes_count * 100) if quotes_count > 0 else 0
            order_to_payment = (paid_invoices / orders_count * 100) if orders_count > 0 else 0
            quote_to_payment = (paid_invoices / quotes_count * 100) if quotes_count > 0 else 0
            
            return {
                "funnel": {
                    "quotes": quotes_count,
                    "accepted_quotes": accepted_quotes,
                    "orders": orders_count,
                    "paid_invoices": paid_invoices
                },
                "conversion_rates": {
                    "quote_to_order": quote_to_order,
                    "order_to_payment": order_to_payment,
                    "quote_to_payment": quote_to_payment
                },
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting conversion funnel: {e}")
            return {}

    async def get_top_customers(self, limit: int, period: str) -> Dict[str, Any]:
        """Get top customers by revenue"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            # Calculate date range based on period
            end_date = date.today()
            if period == "monthly":
                start_date = end_date.replace(day=1)
            elif period == "quarterly":
                start_date = end_date.replace(month=((end_date.month - 1) // 3) * 3 + 1, day=1)
            else:  # yearly
                start_date = end_date.replace(month=1, day=1)
            
            pipeline = [
                {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "customer_id": "$customer_id",
                            "customer_name": "$customer_name"
                        },
                        "total_revenue": {"$sum": "$total_amount"},
                        "total_orders": {"$sum": 1}
                    }
                },
                {"$sort": {"total_revenue": -1}},
                {"$limit": limit}
            ]
            
            results = await orders_collection.aggregate(pipeline).to_list(length=None)
            
            return {
                "top_customers": results,
                "period": period,
                "date_range": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting top customers: {e}")
            return {}

    async def get_top_products(self, limit: int, metric: str, period: str) -> Dict[str, Any]:
        """Get top products by revenue, quantity, or profit"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            # Calculate date range based on period
            end_date = date.today()
            if period == "monthly":
                start_date = end_date.replace(day=1)
            elif period == "quarterly":
                start_date = end_date.replace(month=((end_date.month - 1) // 3) * 3 + 1, day=1)
            else:  # yearly
                start_date = end_date.replace(month=1, day=1)
            
            # Define sorting metric
            sort_field = {
                "revenue": "total_revenue",
                "quantity": "total_quantity",
                "profit": "total_profit"  # This would require cost data
            }.get(metric, "total_revenue")
            
            pipeline = [
                {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
                    }
                },
                {"$unwind": "$line_items"},
                {
                    "$group": {
                        "_id": {
                            "product_id": "$line_items.product_id",
                            "product_name": "$line_items.product_name"
                        },
                        "total_revenue": {"$sum": "$line_items.line_total"},
                        "total_quantity": {"$sum": "$line_items.quantity"},
                        "total_orders": {"$sum": 1}
                    }
                },
                {"$sort": {sort_field: -1}},
                {"$limit": limit}
            ]
            
            results = await orders_collection.aggregate(pipeline).to_list(length=None)
            
            return {
                "top_products": results,
                "metric": metric,
                "period": period,
                "date_range": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting top products: {e}")
            return {}

    async def get_sales_trends(self, metric: str, period: str, start_date: date, end_date: date) -> Dict[str, Any]:
        """Get sales trends over time"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            # Define grouping format
            group_formats = {
                "daily": {"$dateToString": {"format": "%Y-%m-%d", "date": "$order_date"}},
                "weekly": {"$dateToString": {"format": "%Y-W%U", "date": "$order_date"}},
                "monthly": {"$dateToString": {"format": "%Y-%m", "date": "$order_date"}}
            }
            
            # Define metric aggregation
            metric_field = {
                "revenue": "$total_amount",
                "orders": 1,
                "customers": "$customer_id"
            }.get(metric, "$total_amount")
            
            if metric == "customers":
                group_stage = {
                    "_id": group_formats.get(period, group_formats["monthly"]),
                    "value": {"$addToSet": metric_field}
                }
                project_stage = {
                    "period": "$_id",
                    "value": {"$size": "$value"}
                }
            else:
                group_stage = {
                    "_id": group_formats.get(period, group_formats["monthly"]),
                    "value": {"$sum": metric_field}
                }
                project_stage = {
                    "period": "$_id",
                    "value": 1
                }
            
            pipeline = [
                {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
                    }
                },
                {"$group": group_stage},
                {"$project": project_stage},
                {"$sort": {"period": 1}}
            ]
            
            results = await orders_collection.aggregate(pipeline).to_list(length=None)
            
            return {
                "trends": results,
                "metric": metric,
                "period": period,
                "date_range": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting sales trends: {e}")
            return {}

    async def get_sales_forecast(self, months_ahead: int, metric: str) -> Dict[str, Any]:
        """Get sales forecast using simple trend analysis"""
        try:
            # This is a simplified forecast - in a real implementation,
            # you would use more sophisticated ML models
            
            # Get historical data for the last 12 months
            end_date = date.today()
            start_date = end_date.replace(year=end_date.year - 1)
            
            historical_data = await self.get_sales_trends(metric, "monthly", start_date, end_date)
            
            if not historical_data.get("trends"):
                return {"forecast": [], "method": "insufficient_data"}
            
            # Simple linear trend forecast
            trends = historical_data["trends"]
            values = [trend["value"] for trend in trends]
            
            # Calculate trend
            if len(values) >= 2:
                trend = (values[-1] - values[0]) / len(values)
                last_value = values[-1]
                
                forecast = []
                for i in range(1, months_ahead + 1):
                    forecast_value = last_value + (trend * i)
                    forecast_date = (end_date.replace(day=1) + timedelta(days=32 * i)).replace(day=1)
                    forecast.append({
                        "period": forecast_date.strftime("%Y-%m"),
                        "value": max(0, forecast_value),  # Ensure non-negative
                        "confidence": max(0.5, 1 - (i * 0.1))  # Decreasing confidence
                    })
                
                return {
                    "forecast": forecast,
                    "method": "linear_trend",
                    "historical_data": trends[-6:],  # Last 6 months
                    "metric": metric
                }
            
            return {"forecast": [], "method": "insufficient_data"}

        except Exception as e:
            logger.error(f"Error getting sales forecast: {e}")
            return {}

    async def get_sales_kpis(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Get key performance indicators (KPIs)"""
        try:
            # Get main metrics
            total_revenue = await self._get_total_revenue(start_date, end_date)
            total_orders = await self._get_total_orders(start_date, end_date)
            total_customers = await self._get_total_customers(start_date, end_date)
            
            # Calculate additional KPIs
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            revenue_per_customer = total_revenue / total_customers if total_customers > 0 else 0
            
            # Get conversion rates
            conversion_data = await self.get_conversion_funnel(start_date, end_date)
            
            # Get growth compared to previous period
            period_days = (end_date - start_date).days
            prev_start = start_date - timedelta(days=period_days)
            prev_end = start_date
            
            prev_revenue = await self._get_total_revenue(prev_start, prev_end)
            prev_orders = await self._get_total_orders(prev_start, prev_end)
            
            revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
            orders_growth = ((total_orders - prev_orders) / prev_orders * 100) if prev_orders > 0 else 0
            
            return {
                "revenue": {
                    "total": total_revenue,
                    "growth": revenue_growth,
                    "per_customer": revenue_per_customer
                },
                "orders": {
                    "total": total_orders,
                    "growth": orders_growth,
                    "avg_value": avg_order_value
                },
                "customers": {
                    "total": total_customers
                },
                "conversion": conversion_data.get("conversion_rates", {}),
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting sales KPIs: {e}")
            return {}

    # Helper methods
    async def _get_total_revenue(self, start_date: date, end_date: date) -> float:
        """Get total revenue for a period"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            pipeline = [
                {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
                    }
                },
                {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
            ]
            
            result = await orders_collection.aggregate(pipeline).to_list(length=1)
            return result[0]["total"] if result else 0.0

        except Exception as e:
            logger.error(f"Error getting total revenue: {e}")
            return 0.0

    async def _get_total_orders(self, start_date: date, end_date: date) -> int:
        """Get total orders for a period"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            count = await orders_collection.count_documents({
                "order_date": {"$gte": start_date, "$lte": end_date},
                "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
            })
            
            return count

        except Exception as e:
            logger.error(f"Error getting total orders: {e}")
            return 0

    async def _get_total_customers(self, start_date: date, end_date: date) -> int:
        """Get total unique customers for a period"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            pipeline = [
                {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
                    }
                },
                {"$group": {"_id": "$customer_id"}},
                {"$count": "total"}
            ]
            
            result = await orders_collection.aggregate(pipeline).to_list(length=1)
            return result[0]["total"] if result else 0

        except Exception as e:
            logger.error(f"Error getting total customers: {e}")
            return 0

    async def _get_top_products_by_revenue(self, limit: int, start_date: date, end_date: date) -> List[Dict]:
        """Get top products by revenue"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            pipeline = [
                {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
                    }
                },
                {"$unwind": "$line_items"},
                {
                    "$group": {
                        "_id": {
                            "product_id": "$line_items.product_id",
                            "product_name": "$line_items.product_name"
                        },
                        "revenue": {"$sum": "$line_items.line_total"}
                    }
                },
                {"$sort": {"revenue": -1}},
                {"$limit": limit}
            ]
            
            return await orders_collection.aggregate(pipeline).to_list(length=limit)

        except Exception as e:
            logger.error(f"Error getting top products: {e}")
            return []

    async def _get_top_customers_by_revenue(self, limit: int, start_date: date, end_date: date) -> List[Dict]:
        """Get top customers by revenue"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            pipeline = [
                {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "customer_id": "$customer_id",
                            "customer_name": "$customer_name"
                        },
                        "revenue": {"$sum": "$total_amount"}
                    }
                },
                {"$sort": {"revenue": -1}},
                {"$limit": limit}
            ]
            
            return await orders_collection.aggregate(pipeline).to_list(length=limit)

        except Exception as e:
            logger.error(f"Error getting top customers: {e}")
            return []

    async def _get_daily_sales_trends(self, start_date: date, end_date: date) -> List[Dict]:
        """Get daily sales trends"""
        try:
            db = get_database()
            orders_collection = db.sales_orders
            
            pipeline = [
                {
                    "$match": {
                        "order_date": {"$gte": start_date, "$lte": end_date},
                        "status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}
                    }
                },
                {
                    "$group": {
                        "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$order_date"}},
                        "revenue": {"$sum": "$total_amount"},
                        "orders": {"$sum": 1}
                    }
                },
                {"$sort": {"_id": 1}}
            ]
            
            return await orders_collection.aggregate(pipeline).to_list(length=None)

        except Exception as e:
            logger.error(f"Error getting daily sales trends: {e}")
            return []


# Global instance
analytics_service = AnalyticsService()
