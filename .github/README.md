# GitHub Actions CI/CD

This directory contains the GitHub Actions workflows for automated deployment.

## Quick Start

1. **Set up GitHub Secrets** (required):
   ```bash
   ./scripts/setup-github-secrets.sh
   ```
   Then add the secrets in GitHub: Settings > Secrets and variables > Actions

2. **Push to main branch** to trigger deployment:
   ```bash
   git push origin main
   ```

3. **Monitor deployment**:
   - Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
   - Watch the workflow execution

4. **Verify deployment**:
   ```bash
   ./scripts/verify-deployment.sh YOUR_EC2_IP
   ```

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `EC2_HOST` | EC2 public IP |
| `EC2_SSH_KEY` | SSH private key (.pem file content) |
| `EC2_USER` | SSH username (default: ubuntu) |

## Workflow: deploy.yml

### Triggers
- Push to `main` or `master` branch
- Manual workflow dispatch

### Jobs

1. **terraform-plan** (optional)
   - Validates Terraform configuration
   - Plans infrastructure changes
   - Triggers on: manual or commit message with `[terraform]`

2. **terraform-apply** (optional)
   - Applies infrastructure changes
   - Creates/updates EC2 instance
   - Triggers on: manual workflow dispatch

3. **build-and-push**
   - Builds Docker images for:
     - auth-service
     - inventory-service
     - sales-service
     - frontend
   - Pushes to GitHub Container Registry (ghcr.io)
   - Uses caching for faster builds

4. **deploy**
   - Deploys to EC2 instance
   - Pulls latest images
   - Restarts services
   - Runs health checks
   - Cleans up old images

## Deployment Flow

```
Push to main
    ↓
Build Docker Images (parallel)
    ↓
Push to GHCR
    ↓
Deploy to EC2
    ↓
Health Checks
    ↓
✅ Deployment Complete
```

## Troubleshooting

### "pull: command not found"
✅ Fixed in latest version - uses `eval` for proper command expansion

### "Permission denied (publickey)"
- Check `EC2_SSH_KEY` secret includes complete key with headers
- Verify key matches EC2 instance

### "Docker permission denied"
✅ Workflow automatically handles sudo and docker group permissions

### Deployment fails but build succeeds
1. SSH into EC2: `ssh -i your-key.pem ubuntu@YOUR_EC2_IP`
2. Check logs: `cd ~/erp && docker compose logs`
3. Check containers: `docker compose ps`
4. Verify .env file: `cat ~/erp/.env`

### Services unhealthy after deployment
- Wait 1-2 minutes for services to fully start
- Check MongoDB is running: `docker compose logs mongodb`
- Verify environment variables in ~/erp/.env

## Manual Deployment

If CI/CD fails, deploy manually:

```bash
export EC2_HOST=your-ec2-ip
export SSH_KEY=~/.ssh/your-key.pem
./scripts/deploy.sh
```

## Documentation

- **Complete Setup Guide**: [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)
- **Fix Summary**: [../CI_CD_FIX_SUMMARY.md](../CI_CD_FIX_SUMMARY.md)
- **Main README**: [../README.md](../README.md)

## Monitoring

### View Logs
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd ~/erp
docker compose logs -f
```

### Check Status
```bash
docker compose ps
```

### Health Checks
```bash
./scripts/verify-deployment.sh YOUR_EC2_IP
```

## Support

For issues:
1. Check [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)
2. Review GitHub Actions logs
3. Check EC2 logs: `docker compose logs`
4. Verify secrets are set correctly

---

**Status**: ✅ Ready for Production
**Last Updated**: December 2025
