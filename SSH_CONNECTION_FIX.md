# 🔧 SSH Connection Timeout Fix

## 🐛 Error
```
ssh: connect to host *** port 22: Connection timed out
scp: Connection closed
Error: Process completed with exit code 255.
```

## 🔍 Root Causes & Solutions

### 1. EC2 Security Group Not Allowing SSH ⭐ (Most Common)

**Problem:** EC2 Security Group doesn't allow SSH (port 22) from GitHub Actions IPs.

**Solution:**

#### Option A: Allow SSH from Anywhere (Quick Fix for Testing)
```bash
# 1. Go to AWS Console → EC2 → Instances
# 2. Select your instance
# 3. Click "Security" tab
# 4. Click on the Security Group (e.g., sg-xxxxx)
# 5. Click "Edit inbound rules"
# 6. Add/modify SSH rule:

Type: SSH
Protocol: TCP
Port: 22
Source: 0.0.0.0/0 (Anywhere IPv4)
Description: SSH access

# Click "Save rules"
```

#### Option B: Allow SSH from GitHub Actions IP Ranges (More Secure)
```bash
# GitHub Actions uses dynamic IPs from these ranges:
# Get current list: https://api.github.com/meta

# Add multiple rules for GitHub's IP ranges:
# Source: Check https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#ip-addresses

# Major ranges include:
# - 20.*.*.* (Azure)
# - 13.*.*.* (Azure)
# - 40.*.*.* (Azure)
# - 104.*.*.* (Azure)
```

**⚠️ Note:** GitHub Actions uses dynamic IPs, so allowing "0.0.0.0/0" is the most reliable option for continuous deployment.

---

### 2. EC2 Instance Stopped or Not Running

**Check Status:**
```bash
# AWS Console → EC2 → Instances
# Look for your instance - should show "Running" in green
```

**Solution:**
```bash
# If stopped, click on instance and select:
# Instance State → Start Instance
```

---

### 3. EC2 Public IP Changed

**Problem:** If you stop/start an EC2 instance, the public IP changes (unless using Elastic IP).

**Check Current IP:**
```bash
# AWS Console → EC2 → Instances → Select instance
# Look at "Public IPv4 address" field
```

**Solution:**

#### Option A: Update GitHub Secret
```bash
# 1. Copy the current public IP from AWS Console
# 2. Go to GitHub: Repository → Settings → Secrets → Actions
# 3. Click on "EC2_HOST" → Update
# 4. Paste the new IP address
# 5. Click "Update secret"
```

#### Option B: Use Elastic IP (Recommended)
```bash
# AWS Console → EC2 → Elastic IPs
# 1. Click "Allocate Elastic IP address"
# 2. Click "Allocate"
# 3. Select the new Elastic IP
# 4. Click "Actions" → "Associate Elastic IP address"
# 5. Select your instance
# 6. Click "Associate"

# Now update GitHub secret with the Elastic IP (won't change)
```

---

### 4. Network ACLs Blocking Traffic

**Check Network ACLs:**
```bash
# AWS Console → VPC → Network ACLs
# Find the ACL for your subnet
# Check Inbound Rules:

Rule #    Type        Protocol    Port    Source        Allow/Deny
100       ALL Traffic ALL         ALL     0.0.0.0/0     ALLOW
*         ALL Traffic ALL         ALL     0.0.0.0/0     DENY

# Make sure there's an ALLOW rule for SSH (port 22)
```

---

### 5. Wrong SSH Key in GitHub Secret

**Verify:**
```bash
# On your local machine, test SSH connection:
ssh -i ~/.ssh/your-ec2-key.pem ubuntu@YOUR_EC2_IP

# If this works, the key is correct
# If this fails, you have the wrong key
```

**Solution:**
```bash
# Get the correct key content:
cat ~/.ssh/your-ec2-key.pem

# Copy the entire output including:
# -----BEGIN RSA PRIVATE KEY-----
# ... all lines ...
# -----END RSA PRIVATE KEY-----

# Update GitHub Secret:
# GitHub → Settings → Secrets → Actions → EC2_SSH_KEY → Update
```

---

### 6. VPC/Subnet Configuration

**Check Instance Networking:**
```bash
# AWS Console → EC2 → Instances → Select instance → Networking tab

# Verify:
✅ Public IPv4 address: Should have an IP (not empty)
✅ Auto-assign public IP: Enabled
✅ VPC: Should be in a VPC with Internet Gateway
✅ Subnet: Should be a public subnet
```

---

## 🔧 Quick Diagnostic Steps

### Step 1: Verify EC2 is Running
```bash
# AWS Console → EC2 → Instances
# Status should be: "Running" (green)
```

### Step 2: Check Security Group
```bash
# Select instance → Security tab → Security groups
# Click on security group
# Inbound rules should include:

Type: SSH
Port: 22
Source: 0.0.0.0/0 or Your IP
```

### Step 3: Get Current Public IP
```bash
# From EC2 instance details page
# Copy: "Public IPv4 address"
```

### Step 4: Test SSH Manually
```bash
# From your local machine:
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# If this works → GitHub secret might be wrong
# If this fails → EC2/network configuration issue
```

### Step 5: Verify GitHub Secrets
```bash
# GitHub → Repository → Settings → Secrets and variables → Actions

# Verify these secrets exist and are correct:
EC2_HOST=Your.EC2.Public.IP
EC2_USER=ubuntu
EC2_SSH_KEY=(entire private key content)
```

---

## 🚀 Recommended Solution (Step by Step)

### 1. Allow SSH in Security Group
```bash
# AWS Console → EC2 → Security Groups
# Find your instance's security group
# Edit Inbound Rules:

Add rule:
Type: SSH
Protocol: TCP  
Port: 22
Source: 0.0.0.0/0
Description: Allow SSH from anywhere

Save rules
```

### 2. Allocate Elastic IP (Optional but Recommended)
```bash
# AWS Console → EC2 → Elastic IPs → Allocate Elastic IP address
# Select the new IP → Actions → Associate Elastic IP address
# Choose your EC2 instance → Associate
```

### 3. Update GitHub Secret
```bash
# Copy the Elastic IP (or current Public IP)
# GitHub → Settings → Secrets → EC2_HOST
# Update with the new IP address
```

### 4. Test Connection
```bash
# From your local machine:
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_NEW_IP

# If successful, try deploying again:
git push origin main
```

---

## 📋 Security Group Configuration

**Recommended Inbound Rules:**

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | 0.0.0.0/0 | SSH from anywhere |
| Custom TCP | TCP | 8001 | 0.0.0.0/0 | Auth Service |
| Custom TCP | TCP | 8002 | 0.0.0.0/0 | Inventory Service |
| Custom TCP | TCP | 8003 | 0.0.0.0/0 | Sales Service |
| HTTP | TCP | 8080 | 0.0.0.0/0 | Frontend |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP (if using Nginx) |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS (if SSL enabled) |

**Outbound Rules:**
```
All traffic → 0.0.0.0/0 (allow all outbound)
```

---

## 🔐 Security Considerations

### For Production:

1. **Use Elastic IP** - Prevents IP changes
2. **Limit SSH access** - Use your organization's IP range instead of 0.0.0.0/0
3. **Use Bastion Host** - Deploy through a bastion/jump server
4. **GitHub Actions Self-hosted Runner** - Run on EC2 for direct access
5. **Use AWS Systems Manager** - Session Manager instead of SSH

### Alternative: Self-Hosted GitHub Runner

If security is a concern, run GitHub Actions on EC2:

```bash
# SSH into EC2
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP

# Install GitHub Actions runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure (get token from GitHub repo settings)
./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN

# Run
./run.sh
```

Then modify `.github/workflows/deploy.yml`:
```yaml
jobs:
  deploy:
    runs-on: self-hosted  # Instead of ubuntu-latest
```

---

## 🆘 Still Not Working?

### Check GitHub Actions Logs

1. Go to: GitHub → Actions tab
2. Click on the failed workflow
3. Expand the "Deploy to EC2" step
4. Look for the exact error message

Common error variations:

**"Connection refused"**
```bash
# EC2 is reachable but SSH service not running
sudo systemctl status sshd
sudo systemctl start sshd
```

**"Permission denied (publickey)"**
```bash
# Wrong SSH key
# Regenerate and update EC2_SSH_KEY secret
```

**"Connection timed out"**
```bash
# Network issue - check Security Group (this guide)
```

**"Host key verification failed"**
```bash
# Add to workflow:
ssh -o StrictHostKeyChecking=no ...
```

---

## ✅ Verification Checklist

Before retrying deployment:

- [ ] EC2 instance is running (green "Running" status)
- [ ] EC2 has a public IP address
- [ ] Security Group allows SSH (port 22) from 0.0.0.0/0
- [ ] Can SSH manually: `ssh -i key.pem ubuntu@IP`
- [ ] GitHub secret EC2_HOST has correct IP
- [ ] GitHub secret EC2_USER is "ubuntu"
- [ ] GitHub secret EC2_SSH_KEY has complete private key
- [ ] Network ACLs allow inbound port 22
- [ ] Subnet has Internet Gateway attached

---

## 🎯 Quick Fix Commands

```bash
# 1. Get current EC2 public IP
# AWS Console → EC2 → Instance → Public IPv4 address
# Let's say it's: 54.123.45.67

# 2. Test SSH from local machine
ssh -i ~/.ssh/your-key.pem ubuntu@54.123.45.67

# If Step 2 works:
#   → Update GitHub secret EC2_HOST to 54.123.45.67
#   → Push again

# If Step 2 fails with "Connection timed out":
#   → Fix Security Group (allow port 22 from 0.0.0.0/0)
#   → Try again

# If Step 2 fails with "Permission denied":
#   → Wrong key - update EC2_SSH_KEY secret
#   → Or recreate EC2 instance with correct key pair
```

---

## 📞 Support

If you're still stuck:

1. **Check AWS CloudWatch Logs** - Instance system logs
2. **Review EC2 Instance Connect** - Try connecting via AWS Console
3. **Verify VPC Configuration** - Ensure Internet Gateway exists
4. **Check AWS Service Health** - https://status.aws.amazon.com/

---

**Status:** Diagnostic Guide  
**Date:** October 16, 2025  
**Next Step:** Fix Security Group or update EC2_HOST secret


