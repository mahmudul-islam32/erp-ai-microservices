# ERP System Frontend

This is the frontend for the ERP system that connects to the authentication microservice.

## Features

- Authentication (login, logout, token refresh)
- User management (view, create, edit, delete)
- Role-based access control
- Dashboard with statistics
- Responsive design

## Tech Stack

- React 18 with TypeScript
- Vite for fast development
- React Router for navigation
- Mantine UI for components
- Axios for API communication

## Setup Instructions

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Running ERP auth microservice (backend)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with:
   ```
   VITE_API_URL=http://localhost:8001
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Access the application at http://localhost:5173

## Project Structure

- `src/components` - Reusable UI components
- `src/context` - React context providers
- `src/layouts` - Page layout components
- `src/pages` - App pages
- `src/services` - API services
- `src/types` - TypeScript interfaces and types
- `src/utils` - Helper functions

## Authentication

The application uses JWT authentication with:
- Access tokens (30 min expiry)
- Refresh tokens (7 day expiry)
- Token refresh mechanism

## Default Login Credentials

- Admin: admin@erp.com / admin123
- Manager: manager@erp.com / manager123 (if created)
- Regular User: user@erp.com / user123 (if created)

## Building for Production

```
npm run build
```

The built application will be in the `dist` directory.

## Docker Deployment

You can also run the frontend in a Docker container:

```bash
# Build the Docker image
docker build -t erp-frontend .

# Run the container
docker run -p 80:80 erp-frontend
```

## Connecting to Backend

The frontend is configured to connect to the auth service at http://localhost:8001.
Make sure your auth service is running before starting the frontend.
