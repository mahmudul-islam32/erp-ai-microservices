from .customers import router as customers_router
from .inventory_products import router as inventory_products_router
from .sales_orders import router as sales_orders_router
from .quotes import router as quotes_router
from .invoices import router as invoices_router
from .analytics import router as analytics_router
from .reports import router as reports_router

__all__ = [
    "customers_router",
    "inventory_products_router",
    "sales_orders_router",
    "quotes_router",
    "invoices_router",
    "analytics_router",
    "reports_router"
]
