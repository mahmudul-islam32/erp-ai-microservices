# ERP Frontend - Inventory Service Integration

This document explains how the ERP frontend is connected to the inventory service and how to use all the inventory management features.

## Overview

The ERP frontend is now fully integrated with the inventory service, providing a complete inventory management solution with the following capabilities:

### Available Features

#### 🏠 **Inventory Dashboard** (`/dashboard/inventory`)
- Real-time inventory statistics and overview
- Low stock and out-of-stock alerts  
- Financial metrics (total value, average costs)
- Operational metrics (products per category, supplier lead times)
- Visual progress indicators and charts

#### 📦 **Product Management** (`/dashboard/inventory/products`)
- Create, read, update, delete products
- Product catalog with pagination and filtering
- Search by name, SKU, or description
- Filter by category, price range, stock levels
- Bulk operations support
- Product image management
- Stock level tracking

#### 🏷️ **Category Management** (`/dashboard/inventory/categories`)
- Hierarchical category structure
- Create, edit, delete categories
- Category tree visualization
- Product count per category
- Category statistics and analytics

#### 🏢 **Warehouse Management** (`/dashboard/inventory/warehouses`)
- Multi-warehouse inventory tracking
- Warehouse location management
- Capacity and contact information
- Active/inactive warehouse status
- Warehouse statistics

#### 📊 **Stock Management** (`/dashboard/inventory/stock`)
- Real-time inventory levels
- Stock adjustments (add, subtract, set)
- Inventory transfers between warehouses
- Transaction history and audit trail
- Low stock alerts and notifications
- Inventory valuation

## API Integration

### Service Architecture

The frontend connects to the inventory service running on `http://localhost:8002` with the following structure:

```
Frontend (React) → Inventory Service (NestJS) → MongoDB
```

### Authentication

All inventory service requests are authenticated using JWT tokens:
- Automatic token refresh on expiration
- HTTP-only cookie authentication
- Role-based access control
- Seamless integration with auth service

### API Endpoints

#### Products API
- `GET /products` - List products with pagination/filtering
- `GET /products/:id` - Get product by ID
- `GET /products/stats` - Product statistics
- `GET /products/low-stock` - Low stock products
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `PUT /products/:id/stock` - Update stock levels
- `DELETE /products/:id` - Delete product

#### Categories API
- `GET /categories` - List categories
- `GET /categories/tree` - Category hierarchy
- `GET /categories/stats` - Category statistics
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

#### Warehouses API
- `GET /warehouses` - List warehouses
- `GET /warehouses/stats` - Warehouse statistics
- `GET /warehouses/:id` - Get warehouse by ID
- `POST /warehouses` - Create warehouse
- `PUT /warehouses/:id` - Update warehouse
- `DELETE /warehouses/:id` - Delete warehouse

#### Inventory API
- `GET /inventory` - List inventory records
- `GET /inventory/stats` - Inventory statistics
- `GET /inventory/low-stock` - Low stock items
- `GET /inventory/out-of-stock` - Out of stock items
- `GET /inventory/:id` - Get inventory by ID
- `POST /inventory` - Create inventory record
- `POST /inventory/adjust` - Adjust stock levels
- `POST /inventory/transfer` - Transfer between warehouses
- `PUT /inventory/:id` - Update inventory
- `DELETE /inventory/:id` - Delete inventory

#### Suppliers API
- `GET /suppliers` - List suppliers
- `GET /suppliers/stats` - Supplier statistics
- `GET /suppliers/:id` - Get supplier by ID
- `POST /suppliers` - Create supplier
- `PUT /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Delete supplier

## Getting Started

### Prerequisites

1. **Auth Service** running on `http://localhost:8001`
2. **Inventory Service** running on `http://localhost:8002`
3. **MongoDB** running on `localhost:27017`
4. **Frontend** running on `http://localhost:5174`

### Quick Start

1. **Start all services:**
   ```bash
   # Start with Docker Compose
   docker-compose up -d
   
   # Or start individually
   cd auth-service && python main.py
   cd inventory-service && npm run start:dev
   cd erp-frontend && npm run dev
   ```

2. **Login to the system:**
   - Navigate to `http://localhost:5174`
   - Use your credentials to login
   - Default admin: `admin@erp.com` / `admin123`

3. **Access inventory features:**
   - Go to **Inventory Dashboard** for overview
   - Manage **Products** to add/edit items
   - Set up **Categories** for organization
   - Configure **Warehouses** for multi-location tracking
   - Use **Stock Management** for inventory operations

### User Roles & Permissions

| Feature | Super Admin | Admin | Manager | Employee | Viewer |
|---------|-------------|-------|---------|----------|--------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Products | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Categories | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Warehouses | ✅ | ✅ | ✅ | ❌ | ❌ |
| Stock Adjustments | ✅ | ✅ | ✅ | ✅ | ❌ |
| Inventory Transfers | ✅ | ✅ | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ |

## Advanced Features

### Real-time Updates
- Live inventory level updates
- Automatic refresh of statistics
- Real-time stock alerts

### Filtering & Search
- Advanced search across all entities
- Multi-criteria filtering
- Pagination with configurable page sizes
- Sorting by multiple fields

### Bulk Operations
- Multi-select for batch operations
- Bulk stock adjustments
- Batch transfers between warehouses

### Audit Trail
- Complete transaction history
- User activity tracking
- Change logs for all operations

### Data Validation
- Client-side form validation
- Server-side data validation
- Error handling and user feedback

## Error Handling

### Connection Issues
- Automatic retry for failed requests
- Graceful fallback for offline scenarios
- User-friendly error messages

### Authentication Errors
- Automatic token refresh
- Redirect to login on auth failure
- Session timeout handling

### Validation Errors
- Field-level error highlighting
- Clear validation messages
- Guided error resolution

## Development

### Adding New Features

1. **Backend (Inventory Service):**
   ```typescript
   // Add new controller endpoint
   @Get('new-feature')
   async newFeature() {
     return this.service.newFeature();
   }
   ```

2. **Frontend Service:**
   ```typescript
   // Add new service method
   async newFeature(): Promise<Data> {
     const response = await inventoryApiClient.get('/new-feature');
     return response.data;
   }
   ```

3. **Frontend Component:**
   ```tsx
   // Use the new service
   const data = await InventoryService.newFeature();
   ```

### Testing

```bash
# Backend tests
cd inventory-service
npm test

# Frontend tests
cd erp-frontend
npm test

# E2E tests
npm run test:e2e
```

## Troubleshooting

### Common Issues

1. **Service not accessible:**
   - Check if inventory service is running on port 8002
   - Verify network connectivity
   - Check CORS configuration

2. **Authentication failed:**
   - Ensure auth service is running
   - Check JWT token validity
   - Verify cookie settings

3. **Data not loading:**
   - Check browser console for errors
   - Verify API endpoint responses
   - Check user permissions

### Debug Mode

Enable debug logging:
```typescript
// In inventory service
LOG_LEVEL=debug npm run start:dev

// In frontend
localStorage.setItem('debug', 'true');
```

## Performance

### Optimization Features
- Paginated data loading
- Lazy loading of components
- Optimized API queries
- Client-side caching
- Debounced search

### Monitoring
- API response times
- Error rates
- User activity metrics
- System performance

## Security

### Data Protection
- All API calls authenticated
- Role-based access control
- Input sanitization
- SQL injection prevention

### Best Practices
- Regular security updates
- Secure coding practices
- Data encryption in transit
- Audit logging

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Check browser console
4. Contact system administrator

---

**Note:** This integration provides a complete inventory management solution with real-time updates, comprehensive filtering, and robust error handling. All features are production-ready and follow enterprise security standards.
