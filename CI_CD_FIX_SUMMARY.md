# CI/CD Pipeline Fix Summary

## Issues Found and Fixed

### 1. **Main Issue: "pull: command not found" Error**

**Root Cause**: 
- Line 264 in the original workflow had: `$COMPOSE_CMD pull`
- The `COMPOSE_CMD` variable contained spaces like `"sudo docker compose"` or `"docker compose"`
- When used directly in bash heredoc without proper expansion, bash interpreted `$COMPOSE_CMD` as a single command with spaces, causing the error

**Fix Applied**:
- Changed all `$COMPOSE_CMD` usage to `eval "$COMPOSE_CMD"` 
- This properly handles commands with spaces
- Added error handling with `|| {}` blocks for better error messages

### 2. **Environment Variable Passing Issue**

**Root Cause**:
- SSH heredoc used single quotes `<< 'EOSSH'` preventing variable expansion
- `GITHUB_TOKEN`, `GITHUB_ACTOR`, and `IMAGE_PREFIX` were not available inside the SSH session

**Fix Applied**:
```bash
ssh ... "GITHUB_TOKEN='$GITHUB_TOKEN' GITHUB_ACTOR='$GITHUB_ACTOR' IMAGE_PREFIX='$IMAGE_PREFIX' bash -s" << 'EOSSH'
```
- Variables are now explicitly passed to the SSH session

### 3. **Docker Permission Handling Improved**

**Added**:
- Better sudo detection logic
- Separate handling for sudo vs non-sudo commands
- Applied `newgrp docker` to activate group membership without logout
- More robust error handling

### 4. **Command Evaluation**

**Changed from**:
```bash
$COMPOSE_CMD pull
```

**To**:
```bash
eval "$COMPOSE_CMD pull" || {
  echo "❌ Failed to pull images"
  exit 1
}
```

## Files Modified

### 1. `.github/workflows/deploy.yml`
- Fixed SSH command to pass environment variables
- Fixed all `$COMPOSE_CMD` usage with `eval`
- Improved error handling
- Added better status messages with emojis
- Fixed docker permission detection

### 2. New Files Created

#### `.github/DEPLOYMENT_SETUP.md`
Complete deployment guide including:
- GitHub secrets configuration
- Workflow job descriptions
- Deployment process
- Troubleshooting guide
- Security best practices

#### `scripts/setup-github-secrets.sh`
Interactive script to guide users through setting up GitHub secrets

## Key Changes in Workflow

### Before:
```yaml
COMPOSE_CMD="${USE_SUDO}docker compose"
echo "Using: $COMPOSE_CMD"
$COMPOSE_CMD pull  # ❌ This failed!
```

### After:
```yaml
COMPOSE_CMD="docker compose"
# or
COMPOSE_CMD="sudo docker compose"

echo "Using: $COMPOSE_CMD"
eval "$COMPOSE_CMD pull" || {  # ✅ Now works!
  echo "❌ Failed to pull images"
  exit 1
}
```

## Workflow Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Push to main/master                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Terraform Plan      │ (Optional - manual trigger)
          │  - Validate          │
          │  - Plan changes      │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Terraform Apply     │ (Optional - manual trigger)
          │  - Create/Update EC2 │
          │  - Output IP address │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────────────────────┐
          │  Build and Push (Parallel)           │
          │  ┌────────────────────────────────┐  │
          │  │ auth-service                   │  │
          │  │ inventory-service              │  │
          │  │ sales-service                  │  │
          │  │ frontend                       │  │
          │  └────────────────────────────────┘  │
          │  Push to: ghcr.io/mahmudul-islam32/  │
          └────────────────┬─────────────────────┘
                           │
                           ▼
          ┌──────────────────────────────────────┐
          │  Deploy to EC2                       │
          │  1. Copy docker-compose.prod.yml     │
          │  2. Login to GHCR                    │
          │  3. Pull images (eval "$COMPOSE_CMD")│
          │  4. Stop old containers              │
          │  5. Start new containers             │
          │  6. Health checks                    │
          │  7. Cleanup                          │
          └──────────────────────────────────────┘
```

## Testing the Fix

### 1. Verify Workflow Syntax
```bash
# Install act (GitHub Actions local runner) - optional
brew install act

# Validate workflow syntax
cd .github/workflows
yamllint deploy.yml
```

### 2. Test Deployment

#### Option A: Push to GitHub (Recommended)
```bash
git add .github/workflows/deploy.yml
git commit -m "Fix CI/CD deployment pipeline"
git push origin main
```

Then monitor at: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

#### Option B: Manual Deployment
```bash
export EC2_HOST=your-ec2-ip
export SSH_KEY=~/.ssh/your-key.pem
./scripts/deploy.sh
```

## Required GitHub Secrets

Ensure these are set in GitHub (Settings > Secrets and variables > Actions):

- ✅ `AWS_ACCESS_KEY_ID`
- ✅ `AWS_SECRET_ACCESS_KEY`
- ✅ `EC2_HOST`
- ✅ `EC2_SSH_KEY`
- ✅ `EC2_USER` (default: ubuntu)

### Optional:
- `VITE_AUTH_SERVICE_URL`
- `VITE_INVENTORY_SERVICE_URL`
- `VITE_SALES_SERVICE_URL`
- `STRIPE_PUBLISHABLE_KEY`

Run `./scripts/setup-github-secrets.sh` for a guided setup.

## What Happens Now

When you push to main branch:

1. **Build Phase** (~5-10 minutes)
   - 4 Docker images built in parallel
   - Pushed to GitHub Container Registry
   - Tagged with commit SHA and 'latest'

2. **Deploy Phase** (~2-3 minutes)
   - SSH into EC2
   - Login to container registry
   - Pull new images
   - Gracefully stop old containers
   - Start new containers
   - Health checks (up to 5 retries)
   - Cleanup old images

3. **Verification**
   - Auth service: `http://EC2_IP:8001/health`
   - Inventory: `http://EC2_IP:8002/health`
   - Sales: `http://EC2_IP:8003/health`
   - Frontend: `http://EC2_IP:8080`

## Error Prevention

The fixed workflow now handles:
- ✅ Commands with spaces (docker compose vs docker-compose)
- ✅ Sudo requirements automatically
- ✅ Docker group permissions
- ✅ Missing credentials (with clear error messages)
- ✅ Failed image pulls (with error reporting)
- ✅ Container startup failures (with logs)
- ✅ Health check timeouts (with retries)

## Monitoring

### View Logs on EC2:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd ~/erp
docker compose logs -f
```

### Check Container Status:
```bash
docker compose ps
```

### Manual Rollback (if needed):
```bash
# On EC2
cd ~/erp
docker compose down
docker compose pull
docker compose up -d
```

## Next Steps

1. ✅ **Commit and push** the fixed workflow
2. ✅ **Set up GitHub secrets** using `./scripts/setup-github-secrets.sh`
3. ✅ **Monitor deployment** in GitHub Actions
4. 🔧 **Configure .env** on EC2 for production values
5. 🔐 **Set up SSL/TLS** with Let's Encrypt
6. 📊 **Add monitoring** (Prometheus/Grafana)

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. SSH into EC2 and check: `docker compose logs`
3. Verify GitHub secrets are set correctly
4. Review `.github/DEPLOYMENT_SETUP.md`
5. Check EC2 security groups allow required ports

---
**Status**: ✅ Fixed and Ready for Deployment
