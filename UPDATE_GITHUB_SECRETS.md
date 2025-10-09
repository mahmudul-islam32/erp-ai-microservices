# ⚡ URGENT: Update GitHub Secrets

## 🔧 Fix Frontend URL Issue

Your frontend is calling wrong URLs because GitHub Secrets have wrong values.

## 📝 Update These Secrets NOW

Go to: https://github.com/mahmudul-islam32/erp-ai-microservices/settings/secrets/actions

**Update/Add these secrets with CORRECT values:**

### **Current (Wrong):**
```
VITE_AUTH_SERVICE_URL = http://localhost:8001 ❌
VITE_INVENTORY_SERVICE_URL = http://localhost:8002 ❌
VITE_SALES_SERVICE_URL = http://localhost:8003 ❌
```

### **Correct (Use These):**
```
VITE_AUTH_SERVICE_URL = http://13.53.39.211:8001 ✅
VITE_INVENTORY_SERVICE_URL = http://13.53.39.211:8002 ✅
VITE_SALES_SERVICE_URL = http://13.53.39.211:8003 ✅
```

## 🚀 Steps to Fix:

1. **Update Secrets** (link above)
2. **Push any change to main** to trigger rebuild:
   ```bash
   cd ~/Desktop/erp-ai-microservices
   git checkout main
   git merge fix/app
   git push origin main
   ```
3. **Wait for GitHub Actions** to rebuild frontend
4. **Frontend will work!** ✅

---

## 📋 Complete GitHub Secrets List

Make sure ALL these are set:

| Secret Name | Value |
|-------------|-------|
| EC2_HOST | `13.53.39.211` |
| EC2_USER | `ubuntu` |
| EC2_SSH_KEY | Content of your .pem file |
| MONGODB_URL | Your MongoDB connection string |
| JWT_SECRET_KEY | Your JWT secret |
| STRIPE_SECRET_KEY | `sk_test_...` |
| STRIPE_PUBLISHABLE_KEY | `pk_test_...` |
| **VITE_AUTH_SERVICE_URL** | `http://13.53.39.211:8001` ⚠️ FIX THIS |
| **VITE_INVENTORY_SERVICE_URL** | `http://13.53.39.211:8002` ⚠️ FIX THIS |
| **VITE_SALES_SERVICE_URL** | `http://13.53.39.211:8003` ⚠️ FIX THIS |

---

## ⏱️ After Updating Secrets:

1. Merge fix/app to main
2. GitHub Actions rebuilds frontend with correct URLs
3. Login works! ✅

---

**Update those 3 VITE_* secrets NOW, then merge to main!** 🚀

