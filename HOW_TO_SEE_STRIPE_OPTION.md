# 🎯 How to See Stripe Payment Option

## ⚠️ IMPORTANT: Clear Your Browser Cache First!

The frontend was just rebuilt with Stripe, but your browser is showing the old cached version.

---

## 🔧 Step 1: Clear Browser Cache

### **Quick Method** (30 seconds):

**On macOS:**
```
Press: Command + Shift + R
```

**On Windows/Linux:**
```
Press: Ctrl + Shift + R
```

### **DevTools Method** (Recommended):

1. Open page: http://localhost:8080
2. Open DevTools: `F12` or `Cmd+Option+I`
3. **Right-click** the refresh button (↻)
4. Select: **"Empty Cache and Hard Reload"**

---

## 🎯 Step 2: Navigate to Order Creation Page

**URL:** http://localhost:8080/dashboard/sales/orders/create

**Navigation:**
```
Dashboard → Sales Management → Sales Orders → Create Order
```

---

## 👀 Step 3: Find the Payment Options Section

Scroll down on the order creation page until you see:

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ORDER NOTES                                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Add any special instructions...                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  PAYMENT OPTIONS  👈 LOOK HERE!                       │
│                                                        │
│  ☐ Process payment immediately                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Step 4: Enable Payment Processing

**Click the checkbox:**

```
☑ Process payment immediately  👈 CHECK THIS BOX!
```

**After checking, you'll see:**

```
┌────────────────────────────────────────────────────────┐
│  PAYMENT OPTIONS                                       │
│                                                        │
│  ☑ Process payment immediately                        │
│                                                        │
│  Payment Method: *                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Select payment method                         ▼ │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🎉 Step 5: See Stripe in Dropdown

**Click the "Select payment method" dropdown:**

```
┌────────────────────────────────────────┐
│ Select payment method               ▼ │
├────────────────────────────────────────┤
│ Cash                                   │
│ Stripe (Credit/Debit Card)      ✨NEW!│ 👈 SHOULD SEE THIS!
│ Credit Card (Manual)                   │
│ Debit Card (Manual)                    │
└────────────────────────────────────────┘
```

---

## 🚨 If You STILL Don't See Stripe Option:

### Check 1: Did you hard refresh?
```bash
# macOS: Cmd + Shift + R
# Windows: Ctrl + Shift + R
```

### Check 2: Try Incognito/Private mode
```bash
# New incognito window
# macOS: Cmd + Shift + N
# Windows: Ctrl + Shift + N
# Then go to: http://localhost:8080
```

### Check 3: Verify frontend is rebuilt
```bash
# Run in terminal:
docker ps | grep frontend

# Should show container created recently
```

### Check 4: Check browser console for errors
```bash
1. Open page: http://localhost:8080/dashboard/sales/orders/create
2. Press F12 (open DevTools)
3. Go to Console tab
4. Look for any red errors
5. Share any errors you see
```

---

## 🧪 Complete Test Flow

### Once you see Stripe option:

1. **Fill order form:**
   - Select customer
   - Add at least one product
   - Verify total amount appears

2. **Enable payment:**
   - ☑ Check "Process payment immediately"
   - Select "Stripe (Credit/Debit Card)"

3. **Notice:**
   - Blue info alert appears saying:
     "After creating the order, you'll be redirected to complete payment via Stripe's secure checkout."

4. **Create order:**
   - Click "Create Order & Process Payment" button
   - Order is created
   - Auto-redirects to order detail page
   - **Stripe payment modal opens automatically!**

5. **Complete payment:**
   - Click "Continue to Payment"
   - Enter card: `4242 4242 4242 4242`
   - Exp: `12/25`, CVC: `123`, ZIP: `12345`
   - Click "Pay"
   - ✅ Success!

---

## 📊 Verification Checklist

Before proceeding, verify:

- [ ] Frontend container was rebuilt (check docker ps timestamps)
- [ ] Browser cache cleared (hard refresh done)
- [ ] On correct URL: http://localhost:8080/dashboard/sales/orders/create
- [ ] Checkbox "Process payment immediately" is checked
- [ ] Dropdown menu is expanded and showing options

---

## 🎯 Quick Terminal Commands

```bash
# 1. Verify frontend is rebuilt
docker ps | grep frontend

# 2. Check frontend build timestamp
docker-compose exec -T frontend ls -l /usr/share/nginx/html/assets/

# 3. Verify Stripe code in build
docker-compose exec -T frontend sh -c "cat /usr/share/nginx/html/assets/index-*.js | grep -c stripe"

# Should return: 5 (or more)
```

---

## 💡 Alternative: Use Development Frontend (Port 5173)

If production frontend cache is stubborn, use dev frontend with hot reload:

```bash
# Start dev frontend (has hot reload, no cache issues)
cd erp-frontend
npm run dev

# Then access at: http://localhost:5173
# Changes appear immediately without rebuild!
```

---

## ✅ Expected Result

After cache clear, when you:
1. Go to order creation page
2. Check "Process payment immediately"
3. Click payment method dropdown

**You WILL see:**
- ✅ Cash
- ✅ **Stripe (Credit/Debit Card)** ← This is the one!
- ✅ Credit Card (Manual)
- ✅ Debit Card (Manual)

---

## 🆘 Still Not Working?

Run this debug command and share the output:

```bash
# Check what's in the dropdown
docker-compose exec -T frontend sh -c "cat /usr/share/nginx/html/assets/index-*.js | grep -o 'Stripe (Credit/Debit Card)'" || echo "Not found"

# Check frontend logs
docker logs erp-frontend
```

---

**TL;DR:**
1. **Hard refresh:** `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows)
2. **Go to:** http://localhost:8080/dashboard/sales/orders/create
3. **Check:** "Process payment immediately"
4. **See:** "Stripe (Credit/Debit Card)" in dropdown ✨

**Built on:** October 7, 2025, 15:34 CEST  
**Status:** ✅ Ready (just need cache clear!)

