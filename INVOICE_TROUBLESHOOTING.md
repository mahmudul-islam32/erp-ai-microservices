# Invoice Feature Troubleshooting Guide

## Quick Fixes

### 1. Hard Refresh Browser
- **Chrome/Edge**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox**: Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Safari**: Press `Cmd+Option+R` (Mac)

### 2. Clear Browser Cache
- Open browser DevTools (F12)
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"

### 3. Check Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for any red error messages
- Share any errors you see

### 4. Verify You're on the Correct Port
- Development: http://localhost:5173
- Production: http://localhost:8080

### 5. Expand Sales Menu in Sidebar
- Click on "Sales" in the sidebar to expand it
- You should see:
  - Overview
  - Customers
  - Orders
  - Quotes
  - **Invoices** (with Receipt icon)

### 6. Direct URL Access
Try accessing invoices directly:
- http://localhost:5173/dashboard/sales/invoices
- http://localhost:8080/dashboard/sales/invoices (if using production)

## What Should Be Visible

1. **Sidebar Menu**: Sales → Invoices (with Receipt icon)
2. **Invoices Page**: 
   - "Create Invoice" button in header
   - List of invoices with PDF download buttons
3. **Orders Page**: "Invoice" button in actions column
4. **Order Detail Page**: "Create Invoice" button in header

## If Still Not Working

1. Check Docker container logs:
   ```bash
   docker-compose logs frontend-dev --tail=100
   ```

2. Restart frontend container:
   ```bash
   docker-compose restart frontend-dev
   ```

3. Rebuild frontend container:
   ```bash
   docker-compose build frontend-dev
   docker-compose up -d frontend-dev
   ```

4. Check if all services are running:
   ```bash
   docker-compose ps
   ```

