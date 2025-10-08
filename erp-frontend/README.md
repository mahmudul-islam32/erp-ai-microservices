# ERP Frontend - Modern React Application

A completely rebuilt, modern ERP frontend built with React, TypeScript, Tailwind CSS, and Redux Toolkit.

## 🚀 Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling (100% Tailwind, no custom CSS)
- **Redux Toolkit** - Centralized state management
- **React Router v6** - Client-side routing
- **React Hook Form + Zod** - Form handling with validation
- **Headless UI** - Accessible UI components
- **Recharts** - Data visualization
- **Axios** - HTTP client with interceptors
- **Sonner** - Toast notifications
- **Lucide React** - Icon library

## 📁 Project Structure

```
src/
├── app/                    # App-level configuration
│   ├── store.ts           # Redux store setup
│   └── hooks.ts           # Typed Redux hooks
├── features/              # Feature modules
│   ├── auth/             # Authentication
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── dashboard/        # Dashboard
│   ├── inventory/        # Inventory management
│   ├── sales/            # Sales management
│   └── users/            # User management
├── shared/               # Shared code
│   ├── api/             # API client
│   ├── components/      # Reusable components
│   │   ├── ui/         # Base UI components
│   │   └── layout/     # Layout components
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utilities
│   └── types/          # Shared types
└── assets/             # Static assets
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b)
- **Danger**: Red (#ef4444)

### UI Components
All components built with Tailwind CSS:
- Button (primary, secondary, outline, danger, ghost)
- Input, Select, Textarea
- Card with Header/Content/Footer
- Modal/Dialog
- Table with sorting & pagination
- Badge, Spinner, Empty States

## 🔧 Setup & Development

### With Docker (Recommended)

1. **Development Mode** (with hot-reload):
   ```bash
   docker-compose --profile development up frontend-dev
   ```
   Access at: http://localhost:5173

2. **Production Mode**:
   ```bash
   docker-compose up frontend
   ```
   Access at: http://localhost:8080

### Local Development (without Docker)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```env
   VITE_AUTH_SERVICE_URL=http://localhost:8001
   VITE_INVENTORY_SERVICE_URL=http://localhost:8002
   VITE_SALES_SERVICE_URL=http://localhost:8003
   VITE_STRIPE_PUBLIC_KEY=your_stripe_key
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 🔐 Authentication

The app uses JWT-based authentication with automatic token refresh:

- **Access Token**: Stored in localStorage, expires in 30 minutes
- **Refresh Token**: Automatically refreshes access token when expired
- **Protected Routes**: Require authentication
- **Role-based Access**: Optional permission checks

### Default Login
- Username: `admin`
- Password: `admin123`

## 🌐 API Integration

The frontend connects to three backend services:

| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 8001 | User authentication & authorization |
| Inventory Service | 8002 | Product & inventory management |
| Sales Service | 8003 | Orders, customers, payments |

### API Client Features
- Automatic token refresh
- Request/Response interceptors
- Error handling with toast notifications
- Type-safe API calls

## 📦 Features

### ✅ Completed
- [x] Authentication (Login, Logout, Token Refresh)
- [x] Protected Routes with role-based access
- [x] Dashboard with charts and metrics
- [x] User Management (List, Create)
- [x] Layout components (Sidebar, Header)
- [x] Navigation structure
- [x] Base UI component library
- [x] Redux state management
- [x] API client with interceptors

### 🚧 In Progress / To Implement
- [ ] Full CRUD for Users
- [ ] Role & Permission management
- [ ] Products CRUD with images
- [ ] Categories & Warehouses
- [ ] Stock management
- [ ] Customers CRUD
- [ ] Sales Orders with Stripe
- [ ] Invoices & Quotes
- [ ] POS Terminal
- [ ] Reports & Analytics

## 🎯 Key Modules

### Dashboard
- Overview metrics (Revenue, Orders, Customers, Products)
- Sales & Orders charts
- Recent activity feed

### User Management
- User CRUD operations
- Role assignment
- Access control
- Session management
- Audit logs

### Inventory
- Product catalog
- Categories & tags
- Warehouse management
- Stock levels & transfers
- Image uploads

### Sales
- Customer management
- Sales orders
- Quotes & Invoices
- Stripe payment integration
- POS terminal

## 🔨 Build Commands

```bash
# Development
npm run dev

# Build (with type checking)
npm run build

# Build (skip type checking - faster)
npm run build:no-type-check

# Preview production build
npm run preview

# Lint
npm run lint
```

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up -d

# Start with development frontend
docker-compose --profile development up -d

# Rebuild frontend only
docker-compose up -d --build frontend

# View logs
docker-compose logs -f frontend-dev

# Stop all services
docker-compose down
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_AUTH_SERVICE_URL` | Auth service URL | http://localhost:8001 |
| `VITE_INVENTORY_SERVICE_URL` | Inventory service URL | http://localhost:8002 |
| `VITE_SALES_SERVICE_URL` | Sales service URL | http://localhost:8003 |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key | - |

## 🎨 Tailwind Configuration

Custom theme extensions:
- Extended color palette (primary, success, warning, danger)
- Custom shadows (soft, medium, large)
- Inter font family
- Custom scrollbar styles

## 🔄 State Management

Redux slices:
- `auth` - User session & authentication
- More slices to be added for other features

## 📚 Code Quality

- **TypeScript**: Strict mode enabled, no `any` types
- **Component Size**: Max 200 lines (split if larger)
- **File Organization**: One component per file
- **Naming**: Clear, descriptive names
- **Comments**: Minimal, self-documenting code

## 🚀 Performance

- Code splitting with React.lazy
- Memoization with React.memo, useMemo, useCallback
- Optimized bundle size
- Tree-shaking enabled
- Production builds minified

## 📖 Documentation

- [Environment Setup](./ENV_SETUP.md)
- Stripe Integration Guide (in `/docs`)
- API documentation (in backend services)

## 🤝 Contributing

1. Follow the established folder structure
2. Use TypeScript strictly
3. Style with Tailwind only (no custom CSS)
4. Create reusable components
5. Update state via Redux
6. Handle errors gracefully

## 📄 License

Internal project - All rights reserved
