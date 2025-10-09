# Frontend Rebuild Complete - Migration Guide

## 🎉 What's New

Your ERP frontend has been completely rebuilt from scratch with modern technologies and best practices!

## 🔄 Major Changes

### Technology Stack
| Old | New | Why? |
|-----|-----|------|
| Mantine UI | Tailwind CSS | Smaller bundle, more flexible, no vendor lock-in |
| Context API | Redux Toolkit | Better state management, devtools, middleware |
| Tabler Icons | Lucide React | Modern, tree-shakeable icons |
| Custom CSS files | 100% Tailwind | Consistent styling, no CSS conflicts |
| Mixed patterns | Feature-based structure | Better organization, scalability |

### Removed Dependencies
- ❌ `@mantine/core`
- ❌ `@mantine/form`
- ❌ `@mantine/hooks`
- ❌ `@tabler/icons-react`

### Added Dependencies
- ✅ `tailwindcss` - Utility-first CSS
- ✅ `@headlessui/react` - Accessible components
- ✅ `react-hook-form` + `zod` - Better form handling
- ✅ `lucide-react` - Modern icons
- ✅ `sonner` - Toast notifications
- ✅ `date-fns` - Date utilities
- ✅ `clsx` - Class name utility

## 📁 New Folder Structure

```
erp-frontend/
├── src/
│   ├── app/                 # ⭐ NEW: App configuration
│   │   ├── store.ts
│   │   └── hooks.ts
│   ├── features/            # ⭐ NEW: Feature modules
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── sales/
│   │   └── users/
│   ├── shared/              # ⭐ NEW: Shared code
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   └── App.tsx
├── tailwind.config.js       # ⭐ NEW: Tailwind configuration
├── postcss.config.js        # ⭐ NEW: PostCSS configuration
└── ENV_SETUP.md            # ⭐ NEW: Environment setup guide
```

### Deleted Old Structure
```
❌ src/components/       → Moved to features/ and shared/
❌ src/context/          → Replaced with Redux
❌ src/hooks/            → Moved to shared/hooks/
❌ src/layouts/          → Moved to shared/components/layout/
❌ src/pages/            → Moved to features/*/pages/
❌ src/services/         → Moved to features/*/services/ and shared/api/
❌ src/store/            → Replaced with app/store.ts
❌ src/types/            → Moved to shared/types/
❌ src/utils/            → Moved to shared/utils/
❌ src/styles/           → Replaced with Tailwind
```

## 🚀 Getting Started

### Option 1: Docker (Recommended)

**Development with Hot-Reload:**
```bash
docker-compose --profile development up -d frontend-dev
```
- Access at: http://localhost:5173
- Changes auto-reload
- Full TypeScript support

**Production Build:**
```bash
docker-compose up -d frontend
```
- Access at: http://localhost:8080
- Optimized & minified
- Served via Nginx

**Rebuild After Changes:**
```bash
# If you modified package.json
docker-compose up -d --build frontend-dev

# If you only changed source code
# Just save - it will hot-reload automatically!
```

### Option 2: Local Development

```bash
cd erp-frontend
npm install
npm run dev
```

## 🔑 Environment Configuration

The new frontend needs these environment variables:

```env
VITE_AUTH_SERVICE_URL=http://localhost:8001
VITE_INVENTORY_SERVICE_URL=http://localhost:8002
VITE_SALES_SERVICE_URL=http://localhost:8003
VITE_STRIPE_PUBLIC_KEY=your_stripe_key
```

**For Docker**: These are set in `docker-compose.yml` ✅

**For Local**: Create `.env` file in `erp-frontend/` directory

## 🎨 UI Component Examples

### Old Way (Mantine)
```tsx
import { Button, TextInput } from '@mantine/core';

<TextInput label="Email" />
<Button color="blue">Submit</Button>
```

### New Way (Custom + Tailwind)
```tsx
import { Button, Input } from '../shared/components/ui';

<Input label="Email" />
<Button variant="primary">Submit</Button>
```

### Available Components
- `Button` - primary, secondary, outline, danger, ghost
- `Input` - with label, error, icons
- `Select` - dropdown
- `Textarea` - multiline input
- `Card` - container with header/content/footer
- `Modal` - dialog/popup
- `Table` - data table
- `Badge` - status indicators
- `Spinner` - loading indicator
- `EmptyState` - no data display

## 📊 State Management

### Old Way (Context)
```tsx
import { useAuth } from './context/AuthContext';
const { user } = useAuth();
```

### New Way (Redux)
```tsx
import { useAppSelector } from '../app/hooks';
const { user } = useAppSelector((state) => state.auth);
```

### Dispatching Actions
```tsx
import { useAppDispatch } from '../app/hooks';
import { login } from '../features/auth/store/authSlice';

const dispatch = useAppDispatch();
await dispatch(login({ username, password }));
```

## 🔌 API Calls

### Old Way
```tsx
import axios from 'axios';
const response = await axios.get('http://localhost:8000/api/users');
```

### New Way
```tsx
import { authApi } from '../shared/api/client';
const response = await authApi.get('/api/v1/users');
// Token automatically added, errors handled, refresh logic included
```

## 🎯 Feature Status

### ✅ Completed & Working
- [x] Authentication (login, logout, token refresh)
- [x] Protected routes
- [x] Main layout (sidebar, header)
- [x] Dashboard with charts
- [x] User management (list, create)
- [x] Navigation structure
- [x] All UI components
- [x] Redux state management
- [x] API client with interceptors

### 🚧 Needs Implementation (Stubs Created)
- [ ] Full user CRUD operations
- [ ] Role & permission management  
- [ ] Product CRUD
- [ ] Categories & warehouses
- [ ] Stock management
- [ ] Customer CRUD
- [ ] Sales orders
- [ ] Stripe payment forms
- [ ] Invoices & quotes

**Note**: All pages exist with stubs. You can now implement the business logic!

## 🎨 Styling Guidelines

### ✅ DO
```tsx
// Use Tailwind classes
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">

// Use our design tokens
<div className="text-primary-600 bg-success-100">

// Compose with clsx
<div className={clsx('base-class', isActive && 'active-class')}>
```

### ❌ DON'T
```tsx
// No inline styles
<div style={{ padding: '24px' }}>

// No custom CSS files
import './MyComponent.css';

// No arbitrary values (use config)
<div className="p-[23px]">  // ❌ Use p-6 instead
```

## 🔒 Authentication Flow

1. User visits `/dashboard`
2. `ProtectedRoute` checks auth state
3. If not authenticated → redirect to `/login`
4. User logs in → tokens saved to localStorage & Redux
5. API calls include token automatically
6. Token expires → auto-refresh
7. Refresh fails → redirect to login

## 📱 Responsive Design

All components are mobile-first:
- Sidebar: Drawer on mobile, fixed on desktop
- Tables: Horizontal scroll on mobile
- Forms: Stack on mobile, grid on desktop
- Navigation: Hamburger menu on mobile

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@mantine/core'"
**Solution**: Mantine was removed. Use new UI components from `shared/components/ui`

### Issue: "Module not found: Can't resolve 'context/AuthContext'"
**Solution**: Auth is now in Redux. Use `useAppSelector((state) => state.auth)`

### Issue: API calls return 404
**Solution**: Check service URLs in docker-compose.yml match your setup:
- Auth: 8001
- Inventory: 8002  
- Sales: 8003

### Issue: Styles not applying
**Solution**: 
1. Check Tailwind config exists
2. Verify `@tailwind` directives in `index.css`
3. Restart dev server

### Issue: Hot reload not working in Docker
**Solution**: Check volume mounts in docker-compose.yml include all config files

## 📚 Next Steps

1. **Start Development Server**
   ```bash
   docker-compose --profile development up -d
   ```

2. **Test Login**
   - Go to http://localhost:5173
   - Login with admin/admin123
   - Explore the new UI

3. **Implement Features**
   - All page stubs are created
   - API client is configured
   - UI components are ready
   - Just add business logic!

4. **Customize Design**
   - Edit `tailwind.config.js` for colors
   - Modify components in `shared/components/ui`
   - All Tailwind, no CSS conflicts

## 🆘 Support

- **Documentation**: `/erp-frontend/README.md`
- **Environment Setup**: `/erp-frontend/ENV_SETUP.md`
- **Docker Commands**: `/DOCKER_COMMANDS.md`
- **Component Examples**: Check existing pages in `features/*/pages/`

## 🎓 Learning Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Headless UI](https://headlessui.com/)

---

**🎊 Congratulations!** Your frontend is now modern, maintainable, and ready for feature development!

