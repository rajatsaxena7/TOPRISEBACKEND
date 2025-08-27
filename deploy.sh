#!/bin/bash

# Production Deployment Script for toprise.in
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting production deployment for toprise.in..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker-compose.prod.yml exists
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found!"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found. Creating from template..."
    cat > .env.production << 'EOF'
# Production Environment Configuration for toprise.in

# API Gateway
API_GATEWAY_PORT=3000
API_GATEWAY_HOST=0.0.0.0

# User Service
USER_SERVICE_PORT=5001
USER_SERVICE_HOST=0.0.0.0
USER_SERVICE_URL=https://toprise.in/api/users

# Product Service
PRODUCT_SERVICE_PORT=5001
PRODUCT_SERVICE_HOST=0.0.0.0
PRODUCT_SERVICE_URL=https://toprise.in/api/category

# Order Service
ORDER_SERVICE_PORT=5001
ORDER_SERVICE_HOST=0.0.0.0
ORDER_SERVICE_URL=https://toprise.in/api/orders

# Notification Service
NOTIFICATION_SERVICE_PORT=5001
NOTIFICATION_SERVICE_HOST=0.0.0.0
NOTIFICATION_SERVICE_URL=https://toprise.in/api/notification

# Database
MONGODB_URI=mongodb+srv://techdev:H1E0bf2fvvPiKZ36@toprise-staging.nshaxai.mongodb.net/?retryWrites=true&w=majority&appName=Toprise-Staging

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672

# Elasticsearch
ELASTICSEARCH_HOST=elasticsearch
ELASTICSEARCH_PORT=9200

# Kibana
KIBANA_PORT=5601

# JWT Secret (should be changed in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Domain Configuration
DOMAIN=toprise.in
WWW_DOMAIN=www.toprise.in
PROTOCOL=https

# CORS Origins
ALLOWED_ORIGINS=https://toprise.in,https://www.toprise.in,http://localhost:3000

# Email Configuration (if using email services)
EMAIL_FROM=noreply@toprise.in
EMAIL_DOMAIN=toprise.in

# Environment
NODE_ENV=production
EOF
    print_status "Created .env.production file"
fi

# Step 1: Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Step 2: Stop existing services
print_status "Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

# Step 3: Create necessary directories
print_status "Creating necessary directories..."
mkdir -p docker-volumes/cache
mkdir -p docker-volumes/elasticsearch-data

# Step 4: Start production services
print_status "Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Step 5: Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Step 6: Check service status
print_status "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Step 7: Health check
print_status "Performing health checks..."

# Check API Gateway
if curl -f -s http://localhost:3000/health > /dev/null; then
    print_status "✅ API Gateway is healthy"
else
    print_error "❌ API Gateway health check failed"
fi

# Check if services are responding
services=("user-service" "product-service" "order-service" "notification-service")
for service in "${services[@]}"; do
    if docker-compose -f docker-compose.prod.yml ps | grep -q "$service.*Up"; then
        print_status "✅ $service is running"
    else
        print_error "❌ $service is not running"
    fi
done

# Step 8: Show logs for debugging
print_status "Recent logs from all services:"
docker-compose -f docker-compose.prod.yml logs --tail=20

print_status "🎉 Deployment completed!"
print_status "Your services should now be accessible at:"
echo "  - Main API: https://toprise.in"
echo "  - User Service: https://toprise.in/api/users"
echo "  - Product Service: https://toprise.in/api/category"
echo "  - Order Service: https://toprise.in/api/orders"
echo "  - Notification Service: https://toprise.in/api/notification"

print_status "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
print_status "To stop services: docker-compose -f docker-compose.prod.yml down"
