# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG VITE_AUTH_SERVICE_URL
ARG VITE_INVENTORY_SERVICE_URL
ARG VITE_SALES_SERVICE_URL
ARG VITE_STRIPE_PUBLIC_KEY

# Set environment variables for build
ENV VITE_AUTH_SERVICE_URL=$VITE_AUTH_SERVICE_URL
ENV VITE_INVENTORY_SERVICE_URL=$VITE_INVENTORY_SERVICE_URL
ENV VITE_SALES_SERVICE_URL=$VITE_SALES_SERVICE_URL
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY

# Copy package files
COPY package*.json ./

# Install dependencies (use install instead of ci for better compatibility)
RUN npm install --legacy-peer-deps

# Copy all files
COPY . .

# Build the app
RUN npm run build || npm run build:no-type-check || vite build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage to nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
