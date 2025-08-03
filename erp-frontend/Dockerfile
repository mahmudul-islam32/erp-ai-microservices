# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all files including package.json
COPY . .

# Install dependencies and build
RUN npm install
# Skip TypeScript type checking during build for faster builds
RUN NODE_ENV=production npm run build:no-type-check

# Production stage
FROM nginx:alpine

# Copy built files from builder stage to nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
