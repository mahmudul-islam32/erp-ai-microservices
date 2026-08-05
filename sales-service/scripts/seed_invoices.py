"""
Seed invoices with correct data structure matching InvoiceInDB model
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, date, timedelta
import random

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import connect_to_mongo, get_database
from app.models.invoice import InvoiceInDB, InvoiceStatus, PaymentStatus
from bson import ObjectId


async def seed_invoices():
    """Seed invoices with correct data structure"""
    print("🌱 Seeding invoices with correct structure...")
    print("=" * 50)
    
    await connect_to_mongo()
    db = get_database()
    
    # Get existing customers and orders
    customers = await db.customers.find({}).to_list(length=100)
    orders = await db.sales_orders.find({}).to_list(length=100)
    
    if not customers:
        print("❌ No customers found. Please seed customers first.")
        return
    
    if not orders:
        print("❌ No orders found. Please seed orders first.")
        return
    
    print(f"📋 Found {len(customers)} customers and {len(orders)} orders")
    
    # Create invoices using InvoiceInDB model
    created_invoices = []
    
    # Create 10 invoices from random orders
    selected_orders = random.sample(orders, min(10, len(orders)))
    
    for order in selected_orders:
        try:
            # Get customer
            customer_id = order.get("customer_id")
            customer = next((c for c in customers if str(c["_id"]) == customer_id), None)
            
            if not customer:
                print(f"   ⚠️  Customer not found for order {order.get('order_number')}, skipping...")
                continue
            
            # Prepare line items from order
            order_line_items = order.get("line_items", [])
            line_items = []
            
            for item in order_line_items:
                line_items.append({
                    "product_id": item.get("product_id", str(ObjectId())),
                    "product_name": item.get("product_name", "Product"),
                    "product_sku": item.get("product_sku", item.get("product_sku", "SKU-001")),
                    "quantity": item.get("quantity", 1),
                    "unit_price": item.get("unit_price", 0.0),
                    "discount_percent": item.get("discount_percent", 0.0),
                    "discount_amount": item.get("discount_amount", 0.0),
                    "tax_rate": item.get("tax_rate", 0.1),
                    "tax_amount": item.get("tax_amount", 0.0),
                    "line_total": item.get("total", item.get("line_total", 0.0)),
                    "notes": None
                })
            
            # Calculate totals
            subtotal = order.get("subtotal", 0.0)
            tax_amount = order.get("tax_amount", 0.0)
            total_amount = order.get("total_amount", subtotal + tax_amount)
            
            # Determine payment status
            paid_amount = order.get("paid_amount", 0.0)
            balance_due = total_amount - paid_amount
            
            if balance_due <= 0:
                payment_status = PaymentStatus.COMPLETED
                invoice_status = InvoiceStatus.PAID
                paid_at = datetime.utcnow() - timedelta(days=random.randint(1, 30))
            elif paid_amount > 0:
                payment_status = PaymentStatus.PROCESSING
                invoice_status = InvoiceStatus.SENT
                paid_at = None
            else:
                payment_status = PaymentStatus.PENDING
                invoice_status = random.choice([InvoiceStatus.DRAFT, InvoiceStatus.SENT])
                paid_at = None
            
            # Check if overdue
            due_date = datetime.utcnow() + timedelta(days=random.randint(-30, 30))
            if due_date < datetime.utcnow() and balance_due > 0:
                invoice_status = InvoiceStatus.OVERDUE
            
            # Prepare dates - convert to datetime for MongoDB storage
            order_date = order.get("order_date", datetime.utcnow())
            if isinstance(order_date, date) and not isinstance(order_date, datetime):
                order_date = datetime.combine(order_date, datetime.min.time())
            
            due_date_dt = due_date
            if isinstance(due_date, date) and not isinstance(due_date, datetime):
                due_date_dt = datetime.combine(due_date, datetime.min.time())
            
            # Create invoice using InvoiceInDB model
            invoice_doc = InvoiceInDB(
                invoice_number=f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{str(ObjectId())[-6:].upper()}",
                order_id=str(order["_id"]),
                order_number=order.get("order_number"),
                customer_id=str(customer["_id"]),
                customer_name=customer.get("company_name") or f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip(),
                customer_email=customer.get("email", ""),
                billing_address=customer.get("billing_address"),
                invoice_date=order_date.date() if isinstance(order_date, datetime) else date.today(),
                due_date=due_date_dt.date() if isinstance(due_date_dt, datetime) else date.today() + timedelta(days=30),
                payment_terms="Net 30",
                line_items=line_items,
                subtotal=subtotal,
                tax_amount=tax_amount,
                total_amount=total_amount,
                paid_amount=paid_amount,
                balance_due=balance_due,
                late_fee_amount=0.0,
                late_fee_rate=None,
                notes=f"Invoice for order {order.get('order_number', 'N/A')}",
                status=invoice_status,
                payment_status=payment_status,
                sent_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)) if invoice_status in [InvoiceStatus.SENT, InvoiceStatus.PAID] else None,
                viewed_at=None,
                paid_at=paid_at,
                created_at=order.get("created_at", datetime.utcnow()),
                updated_at=datetime.utcnow(),
                created_by="system",
                updated_by=None
            )
            
            # Insert invoice using dict with _id alias
            invoice_dict = invoice_doc.model_dump(by_alias=True, exclude={"id"})
            
            # Convert date fields to datetime for MongoDB
            if "invoice_date" in invoice_dict and isinstance(invoice_dict["invoice_date"], date):
                invoice_dict["invoice_date"] = datetime.combine(invoice_dict["invoice_date"], datetime.min.time())
            if "due_date" in invoice_dict and isinstance(invoice_dict["due_date"], date):
                invoice_dict["due_date"] = datetime.combine(invoice_dict["due_date"], datetime.min.time())
            
            result = await db.invoices.insert_one(invoice_dict)
            
            created_invoices.append({
                "_id": result.inserted_id,
                "invoice_number": invoice_doc.invoice_number,
                "total_amount": invoice_doc.total_amount
            })
            
            print(f"   ✅ Created invoice: {invoice_doc.invoice_number} (${invoice_doc.total_amount:.2f}) - {invoice_status.value}")
            
        except Exception as e:
            print(f"   ❌ Failed to create invoice: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Summary
    status_counts = {}
    for inv in created_invoices:
        # Get status from database
        invoice = await db.invoices.find_one({"_id": inv["_id"]})
        if invoice:
            status = invoice.get("status", "draft")
            status_counts[status] = status_counts.get(status, 0) + 1
    
    print(f"\n✅ Created {len(created_invoices)} invoices")
    print("   Status breakdown:")
    for status, count in sorted(status_counts.items()):
        print(f"   • {status}: {count}")
    
    print("\n" + "=" * 50)
    print("✅ Invoice seeding complete!")
    print(f"   • Total invoices: {len(created_invoices)}")
    print(f"   • Total value: ${sum(inv['total_amount'] for inv in created_invoices):.2f}")
    print("=" * 50)


if __name__ == "__main__":
    try:
        asyncio.run(seed_invoices())
    except Exception as e:
        print(f"\n❌ Seeding failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

