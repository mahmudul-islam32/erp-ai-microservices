#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
from datetime import datetime

# Add the app directory to the Python path
sys.path.append('/app')

from app.config import settings

async def migrate_old_orders():
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    # Find orders with old schema (having customer_info field)
    old_orders = await db.sales_orders.find({'customer_info': {'$exists': True}}).to_list(None)
    
    print(f'Found {len(old_orders)} orders with old schema')
    
    for order in old_orders:
        # Create updated order with new schema
        updated_order = {
            '_id': order['_id'],
            'order_number': order['order_number'],
            'customer_id': str(order['customer_id']),
            'customer_name': order['customer_info'].get('name', 'Unknown'),
            'customer_email': order['customer_info'].get('email', ''),
            'order_date': order['order_date'].strftime('%Y-%m-%d') if isinstance(order['order_date'], datetime) else str(order['order_date']),
            'expected_delivery_date': order['expected_delivery_date'].strftime('%Y-%m-%d') if order.get('expected_delivery_date') and isinstance(order['expected_delivery_date'], datetime) else None,
            'actual_delivery_date': None,
            'shipping_method': 'standard',
            'shipping_address': order.get('shipping_address', {}),
            'priority': 'normal',
            'sales_rep_id': None,
            'sales_rep_name': None,
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
                for item in order.get('items', [])
            ],
            'subtotal': order.get('subtotal', 0.0),
            'subtotal_discount_percent': 0.0,
            'subtotal_discount_amount': order.get('total_discount', 0.0),
            'tax_amount': order.get('total_tax', 0.0),
            'shipping_cost': 0.0,
            'total_amount': order.get('total_amount', 0.0),
            'payment_status': 'pending',
            'paid_amount': 0.0,
            'balance_due': order.get('total_amount', 0.0),
            'notes': order.get('notes', ''),
            'internal_notes': None,
            'status': order.get('status', 'draft'),
            'created_at': order.get('created_at', datetime.utcnow()),
            'updated_at': order.get('updated_at', datetime.utcnow()),
            'created_by': 'system_migration',
            'updated_by': None
        }
        
        # Replace the old order with the updated one
        await db.sales_orders.replace_one({'_id': order['_id']}, updated_order)
        print(f'Migrated order {order["order_number"]}')
    
    print('Migration completed!')

if __name__ == "__main__":
    asyncio.run(migrate_old_orders())
