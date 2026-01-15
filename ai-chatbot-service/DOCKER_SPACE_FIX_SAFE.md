# Safe Docker Disk Space Cleanup (Preserves Containers)

## The Problem
Docker build failing with "no space left on device" error.

## Safe Cleanup (Won't Affect Running Containers)

### 1. Clean Build Cache (SAFE)
This removes build cache only - doesn't affect containers or images:
```bash
docker builder prune -f
```
This freed up: **~6.9GB** of build cache

### 2. Clean Dangling Images (SAFE)
This removes only dangling (untagged) images - running containers are safe:
```bash
docker image prune -f
```

### 3. Check What Can Be Safely Removed
```bash
# See disk usage
docker system df

# See which images are unused (but keep them for now)
docker images
```

## If Still Need More Space

### Option A: Remove Specific Unused Images (Manual)
```bash
# List images
docker images

# Remove specific image (only if not used by any container)
docker rmi <image_id>
```

### Option B: Increase Docker Disk Space (Docker Desktop)

**macOS:**
1. Open Docker Desktop
2. Click Settings (gear icon)
3. Go to "Resources" → "Advanced"
4. Increase "Disk image size" (e.g., 60GB → 100GB)
5. Click "Apply & Restart"

This increases Docker's virtual disk without affecting system disk.

### Option C: Clean Unused Volumes (CAREFUL - Check First)
```bash
# See which volumes are unused
docker volume ls

# Only prune if you're sure (some volumes contain data)
# docker volume prune -f  # COMMENTED OUT - use with caution
```

## What We DIDN'T Do (To Keep Your Containers Safe)
- ❌ `docker container prune` - Would remove stopped containers
- ❌ `docker system prune` - Would remove containers, networks, etc.
- ❌ `docker volume prune` - Could remove data volumes

## Verify Your Containers Are Safe
```bash
# Check running containers (should all still be there)
docker ps

# Check all containers (running + stopped)
docker ps -a
```

## Rebuild After Cleanup
```bash
# Try building again
docker-compose build ai-chatbot-service

# Or rebuild just the chatbot service
docker-compose build --no-cache ai-chatbot-service
```

## Prevention
- Regularly clean build cache: `docker builder prune -f`
- Increase Docker disk space in Docker Desktop settings
- Use `.dockerignore` to reduce build context size

