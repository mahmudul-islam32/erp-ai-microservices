# 🔧 SSH Connection Troubleshooting - Step by Step

## Current Error
```
ssh: connect to host 13.53.39.211 port 22: Operation timed out
```

## 🎯 Root Cause
**"Operation timed out"** = Network/Firewall blocking the connection (NOT a credentials issue)

---

## ✅ Solution Steps (Do These in Order)

### Step 1: Check EC2 Instance Status

**AWS Console → EC2 → Instances**

1. Find instance with IP `13.53.39.211`
2. Check **Instance state**: Should be **"Running"** (green)
3. If stopped → Click **Actions** → **Instance State** → **Start**

---

### Step 2: Fix Security Group (THIS IS THE ISSUE!)

**AWS Console → EC2 → Instances → Your Instance**

1. Click on **"Security"** tab (bottom panel)
2. You'll see something like: `Security groups: sg-xxxxxxxxx (launch-wizard-X)`
3. **Click on the security group link** `sg-xxxxxxxxx`
4. Click **"Edit inbound rules"** button
5. Check if there's an SSH rule:

**If NO SSH rule exists (most likely):**
- Click **"Add rule"**
- Set:
  ```
  Type: SSH
  Protocol: TCP
  Port range: 22
  Source: Anywhere-IPv4 (0.0.0.0/0)
  Description: SSH access
  ```
- Click **"Save rules"**

**If SSH rule exists but has wrong source:**
- Edit the existing SSH rule
- Change **Source** to: `0.0.0.0/0`
- Click **"Save rules"**

---

### Step 3: Test SSH Connection

Wait 5-10 seconds after changing security group, then try:

```bash
# If you know your key file location:
ssh -i ~/.ssh/your-key.pem ubuntu@13.53.39.211

# If you're not sure which key file:
# Try these common locations:
ssh -i ~/.ssh/id_rsa ubuntu@13.53.39.211
ssh -i ~/.ssh/id_ed25519 ubuntu@13.53.39.211

# List all keys in .ssh folder
ls -la ~/.ssh/

# Look for .pem files (AWS keys)
ls -la ~/.ssh/*.pem
```

---

## 🔍 Detailed Diagnostics

### Issue A: "Operation timed out" (Your Current Issue)

**Cause:** Firewall/Security Group blocking port 22

**Fix:** See Step 2 above - Add SSH rule to Security Group

---

### Issue B: "Permission denied (publickey)"

**Cause:** Wrong SSH key or wrong username

**Fix:**
```bash
# 1. Check key file permissions (must be 400 or 600)
chmod 400 ~/.ssh/your-key.pem

# 2. Try different usernames
ssh -i ~/.ssh/your-key.pem ubuntu@13.53.39.211   # Ubuntu/Debian
ssh -i ~/.ssh/your-key.pem ec2-user@13.53.39.211  # Amazon Linux
ssh -i ~/.ssh/your-key.pem admin@13.53.39.211     # Some Debian

# 3. Find the correct key in AWS
# AWS Console → EC2 → Instances → Your Instance
# Look for: "Key pair name" in instance details
# That's the key you need in ~/.ssh/
```

---

### Issue C: "Connection refused"

**Cause:** SSH service not running on EC2

**Fix:**
```bash
# Use EC2 Instance Connect from AWS Console:
# AWS Console → EC2 → Instances → Select Instance
# Click "Connect" button → "EC2 Instance Connect" tab
# Click "Connect"

# Once connected, restart SSH service:
sudo systemctl status ssh
sudo systemctl restart ssh
```

---

## 📋 Complete Security Group Configuration

Your Security Group should have these inbound rules:

```
Type         Protocol  Port Range  Source      Description
─────────────────────────────────────────────────────────────
SSH          TCP       22          0.0.0.0/0   SSH access
Custom TCP   TCP       8001        0.0.0.0/0   Auth Service API
Custom TCP   TCP       8002        0.0.0.0/0   Inventory Service API
Custom TCP   TCP       8003        0.0.0.0/0   Sales Service API
Custom TCP   TCP       8080        0.0.0.0/0   Frontend Web UI
HTTP         TCP       80          0.0.0.0/0   HTTP (if using Nginx)
HTTPS        TCP       443         0.0.0.0/0   HTTPS (if SSL enabled)
```

**Outbound rules:** Should allow all traffic (default)

---

## 🖥️ AWS Console Navigation (Visual Guide)

### Finding Security Group:

```
1. Go to: https://console.aws.amazon.com/ec2/
2. Click: "Instances" in left sidebar
3. Find: Your instance (IP: 13.53.39.211)
4. Click: On the instance (checkbox or row)
5. Look: Bottom panel - "Security" tab
6. Click: The security group link (blue text like "sg-xxxxx")
7. Click: "Edit inbound rules" button (top right)
8. Add: SSH rule if missing
9. Save: Click "Save rules" button
```

### Screenshot Locations:

**Instance List:**
```
┌─────────────────────────────────────────────────────────┐
│ EC2 > Instances                                          │
├─────────────────────────────────────────────────────────┤
│ [ ] Instance ID    Public IPv4      Instance state      │
│ [x] i-xxxxx       13.53.39.211     🟢 Running          │
│                                                          │
│ Details | Security | Networking | Storage | ...         │ ← Click here
└─────────────────────────────────────────────────────────┘
```

**Security Tab:**
```
┌─────────────────────────────────────────────────────────┐
│ Security                                                 │
├─────────────────────────────────────────────────────────┤
│ Security groups: sg-xxxxx (launch-wizard-1)             │ ← Click this link
│                                                          │
│ Inbound rules:                                          │
│   None or Wrong rules                                   │
└─────────────────────────────────────────────────────────┘
```

**Security Group Page:**
```
┌─────────────────────────────────────────────────────────┐
│ Security group: sg-xxxxx                                 │
│                                                          │
│ [Edit inbound rules]  [Edit outbound rules]            │ ← Click this
├─────────────────────────────────────────────────────────┤
│ Inbound rules:                                          │
│   Currently empty or missing SSH                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing & Verification

### Test 1: Check if Port 22 is Open

```bash
# From your local machine:
nc -zv 13.53.39.211 22

# Expected after fix:
# Connection to 13.53.39.211 port 22 [tcp/ssh] succeeded!

# Current (before fix):
# Operation timed out
```

### Test 2: SSH with Verbose Output

```bash
ssh -vvv -i ~/.ssh/your-key.pem ubuntu@13.53.39.211

# Look for:
# "connect to host 13.53.39.211 port 22: Operation timed out"
#   → Security Group issue (fix Step 2)
#
# "Permission denied (publickey)"
#   → Wrong key or wrong username
#
# "Connection refused"
#   → SSH service not running
```

### Test 3: Alternative Connection Methods

**Option A: EC2 Instance Connect (Browser-based SSH)**
```
1. AWS Console → EC2 → Instances
2. Select your instance
3. Click "Connect" button (top right)
4. Choose "EC2 Instance Connect" tab
5. Click "Connect" button
6. Browser opens with terminal access
```

**Option B: Session Manager (No SSH Required)**
```
1. AWS Console → Systems Manager → Session Manager
2. Click "Start session"
3. Select your instance
4. Click "Start session"
```

---

## 🔐 Key File Issues

### Find Your Key File

```bash
# List all SSH keys
ls -la ~/.ssh/

# Common locations:
~/.ssh/id_rsa
~/.ssh/id_ed25519
~/.ssh/aws-key.pem
~/.ssh/ec2-key.pem
~/.ssh/your-name-key.pem

# Find which key was used for this EC2:
# AWS Console → EC2 → Instance → Details tab → "Key pair name"
```

### Fix Key Permissions

```bash
# Keys must have restrictive permissions
chmod 400 ~/.ssh/your-key.pem

# Or
chmod 600 ~/.ssh/your-key.pem

# Verify
ls -l ~/.ssh/your-key.pem
# Should show: -r-------- or -rw-------
```

### If You Lost Your Key

**Option 1: Use EC2 Instance Connect (if AMI supports it)**
```
AWS Console → EC2 → Connect → EC2 Instance Connect
```

**Option 2: Attach Volume to Another Instance**
```
1. Stop instance
2. Detach root volume
3. Attach to another instance
4. Mount and add new public key to ~/.ssh/authorized_keys
5. Detach and reattach to original instance
6. Start instance
```

**Option 3: Create New Instance**
```
1. Create AMI from current instance
2. Launch new instance from AMI with new key pair
3. Terminate old instance
```

---

## ⚡ Quick Fix Commands

### If You Have AWS CLI Installed:

```bash
# 1. Find your instance ID
aws ec2 describe-instances \
  --filters "Name=ip-address,Values=13.53.39.211" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text

# Output example: i-0123456789abcdef

# 2. Find security group
aws ec2 describe-instances \
  --instance-ids i-0123456789abcdef \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
  --output text

# Output example: sg-0123456789abcdef

# 3. Add SSH rule to security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-0123456789abcdef \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

# 4. Try SSH again
ssh -i ~/.ssh/your-key.pem ubuntu@13.53.39.211
```

---

## ✅ Success Checklist

Before SSH will work, verify:

- [ ] EC2 instance is **Running** (not stopped)
- [ ] Security Group has **SSH rule** (port 22) with source **0.0.0.0/0**
- [ ] You have the **correct key file** (check "Key pair name" in EC2 console)
- [ ] Key file has **correct permissions** (400 or 600)
- [ ] Using correct **username** (usually `ubuntu` for Ubuntu AMI)
- [ ] Instance has **public IP** assigned (13.53.39.211 is visible in console)
- [ ] Subnet has **Internet Gateway** attached
- [ ] Network ACL allows **inbound port 22**

---

## 🎯 Most Common Solution

**95% of "Operation timed out" errors are fixed by:**

1. AWS Console → EC2 → Instances
2. Select your instance → **Security** tab
3. Click security group link
4. **Edit inbound rules** → **Add rule**
5. Type: **SSH**, Port: **22**, Source: **0.0.0.0/0**
6. **Save rules**
7. Wait 10 seconds
8. Try SSH again: `ssh -i ~/.ssh/your-key.pem ubuntu@13.53.39.211`

---

## 📞 Need More Help?

### Check These Logs:

**GitHub Secret Values:**
```bash
# Verify in GitHub → Settings → Secrets:
EC2_HOST = 13.53.39.211
EC2_USER = ubuntu
EC2_SSH_KEY = (full private key content)
```

**AWS Console Checklist:**
```
✅ Instance: Running
✅ Public IP: 13.53.39.211
✅ Key pair name: (note this)
✅ Security Group: Has SSH rule
✅ Subnet: Public subnet with IGW
```

**Local Machine:**
```bash
# Find your SSH keys
ls -la ~/.ssh/*.pem

# Test network connectivity
ping 13.53.39.211
nc -zv 13.53.39.211 22
```

---

**Status:** Troubleshooting Guide  
**Issue:** SSH Operation timed out  
**Solution:** Add SSH rule to Security Group  
**Date:** October 16, 2025


