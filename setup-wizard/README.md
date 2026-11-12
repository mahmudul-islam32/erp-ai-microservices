# 🎯 ERP System - Installation Guide

**Visual guide for easy installation**

---

## 🚀 How to Install

### Step 1: Open This Guide

```
Double-click: setup-wizard/index.html
```

A beautiful guide will open in your browser showing all installation options.

---

### Step 2: Choose Installation Method

The guide shows **3 installation methods**:

#### ⭐ Method 1: Terminal Wizard (Recommended)
- Run from the repository root: `./setup.sh`
- Walks through six steps: checks Docker, Docker Compose and the ports it needs (8080, 8001, 8002, 8003, 27017, 6379), asks for an app name, company name, timezone, currency and whether to load demo data, asks for your admin email, password (at least 8 characters) and name, writes `.env` with generated secrets, starts the containers and creates the admin user
- Offers to open http://localhost:8080 in your browser at the end

#### ⚡ Method 2: Automated
- Run from the repository root: `./install.sh`
- Uses defaults: copies `.env.example` to `.env`, generates the JWT, MongoDB and Redis secrets (needs `python3`), pulls and starts the containers and waits for the auth, inventory and sales health checks and the frontend
- Still asks two questions: whether to overwrite an existing `.env`, and whether to load demo data
- Creates the admin account `admin@example.com` with password `admin123`; change it after the first login

#### 📖 Method 3: Manual Setup
- Full control over every step
- See [`docs/INSTALLATION.md`](../docs/INSTALLATION.md)

Both scripts call the `docker-compose` command, so the standalone Docker Compose binary must be on your `PATH`. When they finish, the frontend is at http://localhost:8080 and the API docs are at http://localhost:8001/docs, http://localhost:8002/docs and http://localhost:8003/docs.

---

### Step 3: Follow the Instructions

The index.html guide provides:
- Step-by-step instructions for each method
- OS-specific tabs (macOS/Windows/Linux) for the terminal wizard
- Copy buttons for commands

---

## 📁 What's in This Folder

```
setup-wizard/
├── index.html    ← Beautiful installation guide (open this!)
└── README.md     ← This file
```

---

## ✨ Why This is Simple

- ✅ No backend needed
- ✅ A single static HTML file
- ✅ Points to actual installers (setup.sh, install.sh)
- ⚠️ The icons load Font Awesome from cdnjs, so without internet the page still works but shows no icons

---

**Open index.html to see the beautiful installation guide!** 🚀
