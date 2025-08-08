#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
from datetime import datetime

# Add the app directory to the Python path
sys.path.append('/app')

from app.config import settings

async def migrate_old_invoices():
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    # Find invoices with old schema (having customer_info field)
    old_invoices = await db.invoices.find({'customer_info': {'$exists': True}}).to_list(None)
    
    print(f'Found {len(old_invoices)} invoices with old schema')
    
    for invoice in old_invoices:
        # Create updated invoice with new schema
        updated_invoice = {
            '_id': invoice['_id'],
            'invoice_number': invoice['invoice_number'],
            'customer_id': str(invoice['customer_id']),
            'customer_name': invoice['customer_info'].get('name', 'Unknown'),
            'customer_email': invoice['customer_info'].get('email', ''),
            'sales_order_id': str(invoice.get('sales_order_id', '')),
            'invoice_date': invoice['invoice_date'].strftime('%Y-%m-%d') if isinstance(invoice['invoice_date'], datetime) else str(invoice['invoice_date']),
            'due_date': invoice['due_date'].strftime('%Y-%m-%d') if isinstance(invoice['due_date'], datetime) else str(invoice['due_date']),
            'payment_terms': invoice.get('payment_terms', 'net_30'),
            'billing_address': invoice.get('billing_address', {}),
            'line_items': [
                {
                    'product_id': str(item['product_id']) if 'product_id' in item else item.get('product_sku', ''),
                    'product_name': item.get('product_name', ''),
                    'product_sku': item.get('product_sku', ''),
                    'quantity': item.get('quantity', 0),
                    'unit_price': item.get('unit_price', 0.0),
                    'discount_percent': item.get('discount_percent', 0.0),
                    'discount_amount': 0.0,
                    'tax_rate': item.get('tax_rate', 0.08),
                    'tax_amount': item.get('line_total', 0.0) * item.get('tax_rate', 0.08) / (1 + item.get('tax_rate', 0.08)),
                    'line_total': item.get('line_total', 0.0),
                    'notes': None
                }
                for item in invoice.get('items', [])
            ],
            'subtotal': invoice.get('subtotal', 0.0),
            'discount_amount': invoice.get('total_discount', 0.0),
            'tax_amount': invoice.get('total_tax', 0.0),
            'shipping_cost': 0.0,
            'total_amount': invoice.get('total_amount', 0.0),
            'payment_status': 'pending',
            'paid_amount': 0.0,
            'balance_due': invoice.get('total_amount', 0.0),
            'status': invoice.get('status', 'draft'),
            'notes': invoice.get('notes', ''),
            'created_at': invoice.get('created_at', datetime.utcnow()),
            'updated_at': invoice.get('updated_at', datetime.utcnow()),
            'created_by': 'system_migration',
            'updated_by': None
        }
        
        # Replace the old invoice with the updated one
        await db.invoices.replace_one({'_id': invoice['_id']}, updated_invoice)
        print(f'Migrated invoice {invoice["invoice_number"]}')
    
    print('Invoice migration completed!')

if __name__ == "__main__":
    asyncio.run(migrate_old_invoices())
