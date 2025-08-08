from .external_services import auth_service, inventory_service
from .customer_service import customer_service, CustomerService
# ProductService removed - now handled by inventory service
from .sales_order_service import sales_order_service, SalesOrderService
from .quote_service import quote_service, QuoteService
from .invoice_service import invoice_service, InvoiceService
from .analytics_service import analytics_service, AnalyticsService
from .reports_service import reports_service, ReportsService
