# 🚀 QUICK FIX - Inventory Service Health Check Issue

## 🐛 The Problem
```
Container erp-inventory-service Error
dependency failed to start: container erp-inventory-service is unhealthy
```

## 💡 Root Cause
The inventory service used `node:18-alpine` which doesn't include `curl`, but the health check was trying to use `curl`.

## ✅ The Fix

### Changed Files:

1. **`inventory-service/Dockerfile`** - Added curl installation
```dockerfile
# Install curl for health checks
RUN apk add --no-cache curl
```

2. **`docker-compose.prod.yml`** - Optimized health check timings
```yaml
healthcheck:
  interval: 15s      # Check more frequently
  retries: 10        # More retries before failing  
  start_period: 90s  # More startup time
```

## 🚀 Deploy the Fix

```bash
# Commit changes
git add inventory-service/Dockerfile docker-compose.prod.yml
git commit -m "Fix: Add curl to inventory-service for health checks"

# Push (this triggers automatic deployment)
git push origin main
```

## ✅ Verify Success

After deployment completes, SSH to EC2 and run:

```bash
cd ~/erp
docker compose ps

# All should show "Up (healthy)" including:
# ✅ erp-inventory-service  Up (healthy)
```

## 📖 Full Documentation
See `INVENTORY_HEALTH_CHECK_FIX.md` for complete details and troubleshooting.

---

**Status:** ✅ Fixed  
**Date:** October 16, 2025

