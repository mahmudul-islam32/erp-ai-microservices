# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the root of the erp-frontend directory with the following variables:

```bash
# API Service URLs
VITE_AUTH_SERVICE_URL=http://localhost:8000
VITE_INVENTORY_SERVICE_URL=http://localhost:3001
VITE_SALES_SERVICE_URL=http://localhost:8001

# Stripe Configuration (for payment processing)
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_publishable_key_here
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with the configuration above

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Service URLs

- **Auth Service**: FastAPI service running on port 8000
- **Inventory Service**: NestJS service running on port 3001
- **Sales Service**: FastAPI service running on port 8001

Make sure all backend services are running before starting the frontend.

## Default Login Credentials

- Username: `admin`
- Password: `admin123`

## Key Technologies

- React 18
- TypeScript
- Tailwind CSS
- Redux Toolkit
- React Router v6
- React Hook Form + Zod
- Headless UI
- Recharts
- Stripe Integration

