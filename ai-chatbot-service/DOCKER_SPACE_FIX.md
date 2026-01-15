# Docker Disk Space Error Fix

## Error
```
no space left on device
```

This error occurs when Docker runs out of disk space during build.

## Quick Fix: Clean Docker Resources

### Option 1: Remove Unused Docker Resources (Recommended)

```bash
# Remove all unused containers, networks, images (both dangling and unreferenced), and optionally, volumes
docker system prune -a --volumes

# This will free up space by removing:
# - Stopped containers
# - Unused networks
# - Dangling images
# - Unreferenced images
# - Unused volumes
```

**Warning**: This removes all unused Docker resources. Make sure no important containers/images are unused.

### Option 2: Selective Cleanup (Safer)

```bash
# Remove stopped containers
docker container prune -f

# Remove unused images (dangling only)
docker image prune -f

# Remove unused images (all unused, including tagged)
docker image prune -a -f

# Remove unused volumes (BE CAREFUL - can delete data)
docker volume prune -f

# Remove unused networks
docker network prune -f
```

### Option 3: Remove Specific Large Images

```bash
# List images by size
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | sort -k3 -h -r

# Remove specific images
docker rmi <image_id_or_name>
```

## Check Disk Space

```bash
# Check available disk space
df -h

# Check Docker disk usage
docker system df
```

## Prevent Future Issues

### 1. Increase Docker Disk Space (Docker Desktop)

**macOS/Windows (Docker Desktop):**
1. Open Docker Desktop
2. Go to Settings/Preferences
3. Resources → Advanced
4. Increase Disk image size (e.g., from 60GB to 100GB)
5. Apply & Restart

### 2. Clean Up Regularly

Add to your workflow:
```bash
# Clean up after builds
docker system prune -f
```

### 3. Use .dockerignore

Ensure `.dockerignore` file exists to exclude unnecessary files from builds.

### 4. Multi-stage Builds

Use multi-stage builds to reduce image size (already implemented in Dockerfile).

## Alternative: Build Without Cache

If you just need to rebuild quickly:

```bash
# Build without cache (smaller temporary space needed)
docker-compose build --no-cache ai-chatbot-service

# Or build specific service
docker build --no-cache -t ai-chatbot-service ./ai-chatbot-service
```

## If Still Out of Space

1. **Free up system disk space:**
   - Remove old files
   - Empty trash
   - Clear browser caches
   - Remove old downloads

2. **Move Docker to external drive** (advanced)

3. **Use smaller base images** (if possible)

## Verify Fix

After cleanup:

```bash
# Check disk space
df -h

# Check Docker space
docker system df

# Try building again
docker-compose build ai-chatbot-service
```

