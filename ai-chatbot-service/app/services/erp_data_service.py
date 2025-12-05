import httpx
from typing import Dict, List, Optional, Any
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class ERPDataService:
    """Service for fetching data from ERP services"""
    
    def __init__(self):
        self.sales_url = settings.sales_service_url
        self.inventory_url = settings.inventory_service_url
        self.finance_url = settings.finance_service_url
        self.hrm_url = settings.hrm_service_url
        self.timeout = 10.0
    
    async def fetch_sales_data(
        self,
        endpoint: str,
        token: str,
        params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Fetch data from sales service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.sales_url}{endpoint}"
                headers = {"Authorization": f"Bearer {token}"}
                
                logger.info(f"Fetching sales data from {url} with params: {params}")
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Sales data received: {data.get('summary', {}) if isinstance(data, dict) else 'unknown format'}")
                    return data
                else:
                    logger.warning(f"Sales service returned {response.status_code}: {response.text}")
                    return None
        except httpx.TimeoutException as e:
            logger.error(f"Timeout fetching sales data from {endpoint}: {e}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error fetching sales data from {endpoint}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error fetching sales data from {endpoint}: {e}", exc_info=True)
            return None
    
    async def fetch_inventory_data(
        self,
        endpoint: str,
        token: str,
        params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Fetch data from inventory service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.inventory_url}{endpoint}"
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Inventory service returned {response.status_code}: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching inventory data: {e}")
            return None
    
    async def fetch_finance_data(
        self,
        endpoint: str,
        token: str,
        params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Fetch data from finance service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.finance_url}{endpoint}"
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Finance service returned {response.status_code}: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching finance data: {e}")
            return None
    
    async def fetch_hrm_data(
        self,
        endpoint: str,
        token: str,
        params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Fetch data from HRM service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.hrm_url}{endpoint}"
                headers = {"Authorization": f"Bearer {token}"}
                
                response = await client.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"HRM service returned {response.status_code}: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching HRM data: {e}")
            return None
    
    async def get_sales_summary(self, token: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Optional[Dict]:
        """Get sales summary data"""
        params = {}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        
        return await self.fetch_sales_data("/api/v1/analytics/dashboard", token, params)
    
    async def get_sales_orders(self, token: str, start_date: Optional[str] = None, end_date: Optional[str] = None, limit: int = 50, search: Optional[str] = None) -> Optional[Dict]:
        """Get actual sales orders list"""
        params = {"limit": limit}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        if search:
            params["search"] = search
        
        logger.info(f"Fetching actual sales orders from /api/v1/sales_orders with params: {params}")
        return await self.fetch_sales_data("/api/v1/sales_orders", token, params)
    
    async def get_order_by_number(self, token: str, order_number: str) -> Optional[Dict]:
        """Get order details by order number"""
        logger.info(f"Fetching order details for order number: {order_number}")
        try:
            # Normalize order number (trim whitespace)
            order_number = order_number.strip() if order_number else ""
            if not order_number:
                logger.warning("Empty order number provided")
                return None
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Use correct endpoint path: /sales-orders (with hyphen, not underscore)
                url = f"{self.sales_url}/api/v1/sales-orders/number/{order_number}"
                headers = {"Authorization": f"Bearer {token}"}
                
                logger.info(f"Fetching order from {url}")
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Order details received for {order_number}")
                    return data
                elif response.status_code == 404:
                    logger.warning(f"Order {order_number} not found")
                    return None
                else:
                    logger.warning(f"Sales service returned {response.status_code}: {response.text}")
                    return None
        except httpx.TimeoutException as e:
            logger.error(f"Timeout fetching order {order_number}: {e}")
            return None
        except httpx.RequestError as e:
            logger.error(f"Request error fetching order {order_number}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error fetching order {order_number}: {e}", exc_info=True)
            return None
    
    async def format_order_details(self, order_data: Dict) -> str:
        """Format single order details for context"""
        if not order_data:
            return "Order not found."
        
        order_number = order_data.get("order_number", "N/A")
        customer_name = order_data.get("customer_name", "Unknown")
        total_amount = order_data.get("total_amount", 0) or 0
        status = order_data.get("status", "unknown")
        order_date = order_data.get("order_date", order_data.get("created_at", "N/A"))
        
        if isinstance(order_date, str) and "T" in order_date:
            order_date = order_date.split("T")[0]
        
        formatted = f"""📋 Order Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order Number: {order_number}
Customer: {customer_name}
Date: {order_date}
Status: {status}
Total Amount: ${total_amount:,.2f}

Line Items:
"""
        
        line_items = order_data.get("line_items", [])
        if line_items:
            for i, item in enumerate(line_items, 1):
                product_name = item.get("product_name", "Unknown Product")
                quantity = item.get("quantity", 0)
                unit_price = item.get("unit_price", 0) or 0
                line_total = item.get("line_total", 0) or 0
                
                formatted += f"  {i}. {product_name}\n"
                formatted += f"     Quantity: {quantity}\n"
                formatted += f"     Unit Price: ${unit_price:,.2f}\n"
                formatted += f"     Total: ${line_total:,.2f}\n\n"
        else:
            formatted += "  No line items found.\n"
        
        # Add shipping info if available
        shipping_address = order_data.get("shipping_address")
        if shipping_address:
            formatted += f"\nShipping Address:\n"
            if isinstance(shipping_address, dict):
                formatted += f"  {shipping_address.get('street', '')}\n"
                formatted += f"  {shipping_address.get('city', '')}, {shipping_address.get('state', '')} {shipping_address.get('postal_code', '')}\n"
        
        return formatted.strip()
    
    async def format_orders_for_context(self, orders_data: Dict) -> str:
        """Format actual orders list for context"""
        if not orders_data:
            return ""
        
        items = orders_data.get("items", [])
        total_count = orders_data.get("total", orders_data.get("total_count", len(items)))
        
        if not items:
            return "No sales orders found."
        
        formatted = f"""📦 Sales Orders List:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Orders: {total_count}
Showing: {len(items)} recent orders

"""
        
        total_revenue = 0
        for i, order in enumerate(items[:20], 1):  # Show max 20 orders
            order_number = order.get("order_number", "N/A")
            customer_name = order.get("customer_name", order.get("customer", {}).get("name", "Unknown"))
            total_amount = order.get("total_amount", 0) or 0
            status = order.get("status", "unknown")
            order_date = order.get("order_date", order.get("created_at", "N/A"))
            
            if isinstance(order_date, str) and "T" in order_date:
                order_date = order_date.split("T")[0]
            
            total_revenue += float(total_amount) if total_amount else 0
            
            formatted += f"{i}. Order {order_number}\n"
            formatted += f"   Customer: {customer_name}\n"
            formatted += f"   Amount: ${total_amount:,.2f}\n"
            formatted += f"   Status: {status}\n"
            formatted += f"   Date: {order_date}\n\n"
        
        formatted += f"\n💰 Total Revenue (shown): ${total_revenue:,.2f}\n"
        
        return formatted.strip()
    
    async def get_inventory_summary(self, token: str) -> Optional[Dict]:
        """Get inventory summary data"""
        # Try multiple inventory endpoints
        try:
            # Try products endpoint
            inventory_data = await self.fetch_inventory_data("/api/v1/products", token, {"limit": 50})
            if inventory_data:
                return inventory_data
            
            # Try summary endpoint if products fails
            return await self.fetch_inventory_data("/api/v1/inventory/summary", token)
        except Exception as e:
            logger.error(f"Error fetching inventory: {e}")
            return None
    
    async def get_finance_summary(self, token: str) -> Optional[Dict]:
        """Get finance summary data"""
        return await self.fetch_finance_data("/api/v1/finance/dashboard", token)
    
    async def format_data_for_context(self, data: Dict, data_type: str) -> str:
        """Format ERP data as context for the LLM or fallback display"""
        if not data:
            return f"No {data_type} data available."
        
        # Format based on data type
        if data_type == "sales":
            summary = data.get("summary", {})
            
            # Check if we have actual data or all zeros
            total_revenue = summary.get('total_revenue', 0) or 0
            total_orders = summary.get('total_orders', 0) or 0
            
            # If all zeros, show a helpful message
            if total_revenue == 0 and total_orders == 0:
                period = data.get('period', {})
                start_date = period.get('start_date', 'N/A')
                end_date = period.get('end_date', 'N/A')
                return f"""📊 Sales Summary:

No sales data found for the period from {start_date} to {end_date}.

💡 This could mean:
- No orders were placed during this period
- Orders exist but are not in the selected date range
- The sales service may need to be checked

Try asking for sales data with a different date range, or check if you have any sales orders in the system."""
            
            # Format revenue
            revenue_str = f"${total_revenue:,.2f}" if isinstance(total_revenue, (int, float)) else str(total_revenue)
            
            # Format average order value
            avg_order_value = summary.get('avg_order_value', 0)
            avg_str = f"${avg_order_value:,.2f}" if isinstance(avg_order_value, (int, float)) else str(avg_order_value)
            
            formatted = f"""📊 Sales Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Total Revenue: {revenue_str}
📦 Total Orders: {total_orders}
💵 Average Order Value: {avg_str}
👥 Total Customers: {summary.get('total_customers', 0)}
"""
            
            # Add growth rates if available
            if 'revenue_growth' in summary:
                growth = summary.get('revenue_growth', 0)
                growth_symbol = "📈" if growth >= 0 else "📉"
                formatted += f"{growth_symbol} Revenue Growth: {growth:.1f}%\n"
            
            if 'orders_growth' in summary:
                growth = summary.get('orders_growth', 0)
                growth_symbol = "📈" if growth >= 0 else "📉"
                formatted += f"{growth_symbol} Orders Growth: {growth:.1f}%\n"
            
            # Add period information if available
            if 'period' in data:
                period = data['period']
                formatted += f"\n📅 Period: {period.get('start_date', 'N/A')} to {period.get('end_date', 'N/A')}\n"
            
            # Add top products if available
            if 'top_products' in data and data['top_products']:
                formatted += "\n🏆 Top Products:\n"
                for i, product in enumerate(data['top_products'][:5], 1):
                    # Handle nested _id structure from MongoDB aggregation
                    if '_id' in product and isinstance(product['_id'], dict):
                        product_name = product['_id'].get('product_name', product['_id'].get('name', 'Unknown'))
                    else:
                        product_name = product.get('name', product.get('product_name', product.get('_id', {}).get('product_name', 'Unknown')))
                    revenue = product.get('revenue', product.get('total_revenue', 0))
                    formatted += f"  {i}. {product_name}: ${revenue:,.2f}\n"
            
            # Add top customers if available
            if 'top_customers' in data and data['top_customers']:
                formatted += "\n👤 Top Customers:\n"
                for i, customer in enumerate(data['top_customers'][:5], 1):
                    # Handle nested _id structure from MongoDB aggregation
                    if '_id' in customer and isinstance(customer['_id'], dict):
                        customer_name = customer['_id'].get('customer_name', customer['_id'].get('name', 'Unknown'))
                    else:
                        customer_name = customer.get('name', customer.get('customer_name', customer.get('_id', {}).get('customer_name', 'Unknown')))
                    revenue = customer.get('revenue', customer.get('total_revenue', 0))
                    formatted += f"  {i}. {customer_name}: ${revenue:,.2f}\n"
            
            return formatted.strip()
            
        elif data_type == "inventory":
            return f"📦 Inventory Data:\n{self._format_dict_nicely(data)}"
        elif data_type == "finance":
            return f"💰 Financial Data:\n{self._format_dict_nicely(data)}"
        else:
            return f"{data_type} data:\n{self._format_dict_nicely(data)}"
    
    def _format_dict_nicely(self, data: Dict, indent: int = 0) -> str:
        """Format dictionary data in a readable way"""
        if isinstance(data, dict):
            lines = []
            for key, value in data.items():
                if isinstance(value, (dict, list)):
                    lines.append(f"{'  ' * indent}• {key.replace('_', ' ').title()}:")
                    lines.append(self._format_dict_nicely(value, indent + 1))
                else:
                    formatted_key = key.replace('_', ' ').title()
                    if isinstance(value, (int, float)) and key.endswith(('price', 'cost', 'revenue', 'amount', 'total')):
                        lines.append(f"{'  ' * indent}• {formatted_key}: ${value:,.2f}")
                    else:
                        lines.append(f"{'  ' * indent}• {formatted_key}: {value}")
            return "\n".join(lines)
        elif isinstance(data, list):
            if len(data) > 0 and isinstance(data[0], dict):
                return "\n".join([f"{'  ' * indent}• Item {i+1}: {self._format_dict_nicely(item, indent + 1)}" for i, item in enumerate(data[:5])])
            return "\n".join([f"{'  ' * indent}• {item}" for item in data[:10]])
        return str(data)

