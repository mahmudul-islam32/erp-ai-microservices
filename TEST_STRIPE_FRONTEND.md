# Testing Stripe Payment in Frontend

## Quick Test Guide (5 minutes)

### Prerequisites
- ✅ Application running (`docker-compose up -d`)
- ✅ Stripe keys configured in environment
- ✅ Test card number ready: `4242 4242 4242 4242`

---

## Step 1: Access the Application

1. **Open browser**: http://localhost:5173
2. **Login** with your credentials

---

## Step 2: Navigate to Sales Orders

```
Dashboard → Sales Management → Sales Orders
```

Or directly: http://localhost:5173/dashboard/sales/orders

---

## Step 3: Create or Open an Order

### Option A: Create New Order (Recommended for testing)

1. Click **"Create Order"** button
2. Fill in order details:
   - Select a customer
   - Add products
   - Ensure total amount > $0
3. Click **"Save Order"**
4. Order will be created in DRAFT or CONFIRMED status

### Option B: Use Existing Order

1. Find an order with:
   - Status: Not CANCELLED
   - Payment Status: Not PAID
   - Total Amount: > $0
2. Click on the order to view details

---

## Step 4: Locate the Stripe Payment Button

On the **Order Detail Page**, look for:

```
┌─────────────────────────────────────────────┐
│ Order Status                                │
│ ┌─────────────┐  ┌──────────────┐          │
│ │ CONFIRMED   │  │ UNPAID       │          │
│ └─────────────┘  └──────────────┘          │
│                                             │
│ Action Buttons:                             │
│ ┌──────────────────────────────┐           │
│ │  💳 Pay with Stripe          │ ← Click!  │
│ │  (Green button)              │           │
│ └──────────────────────────────┘           │
│                                             │
│ [Other action buttons below...]            │
└─────────────────────────────────────────────┘
```

**Look for:**
- 🟢 Green button
- 💳 Credit card icon
- Text: "Pay with Stripe"

**Location:** 
- In the "Order Status and Actions" card
- Top of the page, below the order number
- Before "Confirm Order" or "Mark as Shipped" buttons

---

## Step 5: Click "Pay with Stripe"

A modal will open with:

```
┌────────────────────────────────────────┐
│ Pay with Stripe                    [X] │
├────────────────────────────────────────┤
│                                        │
│ Amount to pay: $99.99                  │
│ Order ID: ORD-2025-001                 │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │  Continue to Payment               │ │
│ └────────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

Click **"Continue to Payment"**

---

## Step 6: Enter Payment Details

After clicking "Continue to Payment", you'll see Stripe Elements:

```
┌────────────────────────────────────────┐
│ Pay with Stripe                    [X] │
├────────────────────────────────────────┤
│                                        │
│ Amount to pay: $99.99                  │
│ Order ID: ORD-2025-001                 │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Card Information                   │ │
│ │ ┌────────────────────────────────┐ │ │
│ │ │ 4242 4242 4242 4242           │ │ │
│ │ └────────────────────────────────┘ │ │
│ │ ┌──────────┐  ┌─────┐  ┌────────┐ │ │
│ │ │ 12 / 25  │  │ 123 │  │ 12345  │ │ │
│ │ └──────────┘  └─────┘  └────────┘ │ │
│ │  MM/YY        CVC      ZIP Code   │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │     Pay $99.99                     │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Powered by Stripe • Secure payment    │
└────────────────────────────────────────┘
```

**Enter test card details:**
- **Card Number**: `4242 4242 4242 4242`
- **Expiry Date**: `12/25` (any future date)
- **CVC**: `123` (any 3 digits)
- **ZIP Code**: `12345` (any 5 digits)

---

## Step 7: Complete Payment

1. Click **"Pay $99.99"** button
2. Wait for processing (2-3 seconds)
3. See success message ✅

```
┌────────────────────────────────────────┐
│ ✅ Success                             │
│ Payment successful!                    │
└────────────────────────────────────────┘
```

4. Modal will close automatically
5. Order page will refresh
6. Payment Status will update to **"PAID"**

---

## Step 8: Verify Payment

After successful payment:

1. **On Order Detail Page:**
   - Payment Status badge → 🟢 **PAID**
   - "Pay with Stripe" button → Disappears (already paid)

2. **In Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/payments
   - You should see the payment listed
   - Click to view details

3. **In Application Database:**
   - Payment record created with `payment_method: "stripe"`
   - Order `payment_status` updated to `"paid"`

---

## 🎨 Visual Location Reference

```
Sales Order Detail Page Layout:
┌─────────────────────────────────────────────────────────┐
│ [← Back] Order #ORD-2025-001                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ORDER STATUS AND ACTIONS                            │ │
│ │                                                     │ │
│ │ Status: [CONFIRMED] [UNPAID]                        │ │
│ │                                                     │ │
│ │ ┌──────────────────┐  ┌──────────────┐             │ │
│ │ │ 💳 Pay with      │  │ ✓ Confirm    │             │ │
│ │ │    Stripe        │  │   Order      │             │ │
│ │ └──────────────────┘  └──────────────┘             │ │
│ │        ↑                                            │ │
│ │   CLICK HERE!                                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ORDER ITEMS                                         │ │
│ │ Product | SKU | Qty | Price | Total                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ORDER SUMMARY                                       │ │
│ │ Subtotal: $90.00                                    │ │
│ │ Tax:      $9.99                                     │ │
│ │ Total:    $99.99                                    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Alternative Test Cards

Try these for different scenarios:

| Card Number | Scenario | Expected Result |
|------------|----------|-----------------|
| `4242 4242 4242 4242` | Success | ✅ Payment succeeds |
| `4000 0000 0000 0002` | Decline | ❌ Card declined error |
| `4000 0025 0000 3155` | 3D Secure | 🔐 Authentication required |
| `4000 0000 0000 9995` | Insufficient funds | ❌ Payment fails |

---

## 🔍 Troubleshooting

### Button Not Visible?

**Check:**
1. ✅ Order payment_status is NOT "paid"
2. ✅ Order status is NOT "cancelled"  
3. ✅ Order total_amount > 0
4. ✅ You're on the order detail page (not order list)

**Quick Fix:**
- Create a new order with products
- Ensure it has a total amount
- Try again

### "Stripe is not initialized" Error?

**Check:**
1. ✅ `STRIPE_PUBLISHABLE_KEY` is set in environment
2. ✅ Sales service is running
3. ✅ Check browser console for errors

**Fix:**
```bash
# Check if config endpoint works
curl http://localhost:8003/api/v1/payments/stripe/config

# Should return: {"publishable_key":"pk_test_..."}
```

### Payment Not Processing?

**Check:**
1. ✅ Backend logs: `docker logs erp-sales-service -f`
2. ✅ Network tab in browser DevTools
3. ✅ Stripe API keys are correct

---

## 📊 Success Indicators

✅ **Button appears** on unpaid orders  
✅ **Modal opens** when clicked  
✅ **Payment form loads** with Stripe Elements  
✅ **Test card accepted** (4242...)  
✅ **Success message** appears  
✅ **Payment status** updates to PAID  
✅ **Button disappears** after payment  
✅ **Payment visible** in Stripe Dashboard  

---

## 🎯 Quick Command Summary

```bash
# 1. Start application
docker-compose up -d

# 2. Check Stripe config
curl http://localhost:8003/api/v1/payments/stripe/config

# 3. View logs
docker logs erp-sales-service -f

# 4. Open application
open http://localhost:5173
```

---

## 📸 Screenshot Locations

Look for the button in these screenshots:

1. **Order Detail Page** - Top section, green button
2. **Payment Modal** - After clicking button
3. **Stripe Elements Form** - After "Continue to Payment"
4. **Success Message** - After payment completes

---

## ✨ Next Steps

After successful test:
1. ✅ Try different test cards
2. ✅ Test refund functionality
3. ✅ Check Stripe Dashboard
4. ✅ Configure webhooks (optional)
5. ✅ Switch to live keys for production

---

**Need Help?**
- Check: [STRIPE_INTEGRATION.md](./docs/STRIPE_INTEGRATION.md)
- Stripe Docs: https://stripe.com/docs
- Test Cards: https://stripe.com/docs/testing

