# Frontend ERP System with Authentication

This is a comprehensive React frontend for the ERP system with authentication. It communicates with the FastAPI auth microservice.

## How to Run the Frontend

1. **Development mode**:
   ```bash
   cd erp-frontend
   npm install
   npm run dev
   ```
   Access at: http://localhost:5173

2. **Using the script**:
   ```bash
   ./start-frontend.sh
   ```

3. **Using Docker**:
   ```bash
   docker-compose up frontend
   ```
   Access at: http://localhost:80

## Architecture

- **Frontend**: React 18 with TypeScript, Vite, React Router, Mantine UI
- **Backend API**: FastAPI auth microservice at http://localhost:8001
- **Database**: MongoDB accessed through the API

## Authentication Flow

1. User logs in through the login page
2. JWT tokens (access and refresh) are generated and stored
3. Protected routes require authentication
4. Token refresh happens automatically when access token expires
5. Role-based permissions control what users can access

## Features

- **Authentication**: Login/logout with JWT token refresh
- **User Management**: Create, view, update, delete users
- **Role-Based Access**: Admin, manager, and user roles with different permissions
- **Dashboard**: Visual display of system statistics
- **Responsive Design**: Works on mobile and desktop

## Default Credentials

- **Admin User**: admin@erp.com / admin123

## Folder Structure

```
erp-frontend/
├─ src/
│  ├─ components/    # Reusable UI components
│  ├─ context/       # React context providers (auth)
│  ├─ layouts/       # Page layouts
│  ├─ pages/         # App pages
│  ├─ services/      # API services
│  ├─ types/         # TypeScript types
│  └─ utils/         # Helper functions
```
