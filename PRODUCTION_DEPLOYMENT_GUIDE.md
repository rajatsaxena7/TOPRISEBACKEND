# Production Deployment Guide for toprise.in

## Overview
This guide explains how to deploy your backend services to be accessible from `https://toprise.in`.

## Current Configuration Status

### ✅ Completed Updates
1. **CORS Configuration**: All services now allow requests from `https://toprise.in` and `https://www.toprise.in`
2. **API Gateway**: Updated to handle CORS for the production domain
3. **Service Ports**: All services are configured to run on their respective ports

## Required Steps for Production Deployment

### 1. Domain and DNS Configuration

#### A. Domain Setup
- Ensure `toprise.in` is registered and pointing to your server
- Configure DNS records:
  ```
  A     toprise.in          → YOUR_SERVER_IP
  A     www.toprise.in      → YOUR_SERVER_IP
  ```

#### B. SSL Certificate
- Install SSL certificate for `toprise.in` and `www.toprise.in`
- You can use Let's Encrypt for free SSL certificates:
  ```bash
  sudo apt-get update
  sudo apt-get install certbot
  sudo certbot certonly --standalone -d toprise.in -d www.toprise.in
  ```

### 2. Reverse Proxy Configuration (Nginx)

Create an Nginx configuration file `/etc/nginx/sites-available/toprise.in`:

```nginx
server {
    listen 80;
    server_name toprise.in www.toprise.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name toprise.in www.toprise.in;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/toprise.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/toprise.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API Gateway (Main Entry Point)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static Files (if serving frontend)
    location /static/ {
        alias /var/www/toprise.in/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/toprise.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Docker Compose Production Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api-gateway:
    image: rajat7121/toprisebackend-api-gateway:latest
    ports:
      - "3000:3000"
    depends_on:
      - user-service
      - product-service
    networks:
      - app-network
    environment:
      - NODE_ENV=production
      - DOMAIN=toprise.in

  user-service:
    image: rajat7121/toprisebackend-user-service:latest
    volumes:
      - ./services/user-service:/app
      - ./packages:/packages
    ports:
      - "5001:5001"
    networks:
      - app-network
    depends_on:
      - rabbitmq
    environment:
      - NODE_ENV=production
      - DOMAIN=toprise.in

  product-service:
    image: rajat7121/toprisebackend-product-service:latest
    volumes:
      - ./services/product-service:/app
      - ./packages:/packages
    ports:
      - "5002:5001"
    networks:
      - app-network
    depends_on:
      - rabbitmq
    environment:
      - NODE_ENV=production
      - DOMAIN=toprise.in

  order-service:
    image: rajat7121/toprisebackend-order-service:latest
    volumes:
      - ./services/order-service:/app
      - ./packages:/packages
    ports:
      - "5003:5001"
    networks:
      - app-network
    depends_on:
      - rabbitmq
    environment:
      - NODE_ENV=production
      - DOMAIN=toprise.in
      - REDIS_HOST=redis
      - REDIS_PORT=6379

  notification-service:
    image: rajat7121/toprisebackend-notification-service:latest
    volumes:
      - ./services/notification-service:/app
      - ./packages:/packages
    ports:
      - "5004:5001"
    networks:
      - app-network
    depends_on:
      - rabbitmq
    environment:
      - NODE_ENV=production
      - DOMAIN=toprise.in

  dealer-worker:
    image: rajat7121/toprisebackend-order-service:latest
    volumes:
      - ./services/order-service:/app
      - ./packages:/packages
    working_dir: /app
    command: ["node", "src/jobs/dealerAssignmentWorker.js"]
    depends_on:
      - order-service
      - redis
    networks:
      - app-network
    environment:
      - NODE_ENV=production
      - DOMAIN=toprise.in
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - PRODUCT_SERVICE_URL=http://product-service:5001
      - MONGODB_URI=mongodb+srv://techdev:H1E0bf2fvvPiKZ36@toprise-staging.nshaxai.mongodb.net/?retryWrites=true&w=majority&appName=Toprise-Staging

  stock-sweeper:
    image: rajat7121/toprisebackend-product-service:latest
    volumes:
      - ./services/product-service:/app
      - ./packages:/packages
    working_dir: /app
    command: ["node", "src/jobs/stockSweeper.js"]
    restart: always
    depends_on: [product-service]
    networks: [app-network]
    environment:
      - NODE_ENV=production
      - DOMAIN=toprise.in

  redis:
    container_name: redis_container
    image: redis:alpine
    restart: always
    command: redis-server --loglevel warning
    ports:
      - "6379:6379"
    volumes:
      - ./docker-volumes/cache:/data
    networks:
      - app-network

  rabbitmq:
    container_name: rabbitmq_container
    image: rabbitmq:latest
    restart: always
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - app-network

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.4
    container_name: elasticsearch_container
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
    volumes:
      - ./docker-volumes/elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - app-network
      - elastic

  kibana:
    container_name: kibana_container
    image: docker.elastic.co/kibana/kibana:8.13.4
    restart: always
    depends_on:
      - elasticsearch
    environment:
      ELASTICSEARCH_HOSTS: "http://elasticsearch_container:9200"
    ports:
      - "5601:5601"
    volumes:
      - ./kibana.yml:/usr/share/kibana/config/kibana.yml:ro
    networks:
      - app-network
      - elastic

networks:
  elastic:
    driver: bridge
  app-network:
    driver: bridge
```

### 4. Environment Variables

Create a `.env.production` file (not tracked in git):

```bash
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
```

### 5. Deployment Commands

```bash
# 1. Pull latest images
docker-compose -f docker-compose.prod.yml pull

# 2. Stop existing services
docker-compose -f docker-compose.prod.yml down

# 3. Start production services
docker-compose -f docker-compose.prod.yml up -d

# 4. Check service status
docker-compose -f docker-compose.prod.yml ps

# 5. View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Testing the Deployment

#### A. Health Check
```bash
curl -k https://toprise.in/health
```

#### B. API Test
```bash
curl -k https://toprise.in/api/users/health
```

#### C. CORS Test
```bash
curl -H "Origin: https://toprise.in" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://toprise.in/api/users
```

### 7. Monitoring and Logs

#### A. Service Logs
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f api-gateway
docker-compose -f docker-compose.prod.yml logs -f user-service
```

#### B. Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### C. SSL Certificate Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
sudo systemctl reload nginx
```

### 8. Security Considerations

1. **Firewall Configuration**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

2. **Regular Updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker-compose -f docker-compose.prod.yml pull
   ```

3. **Backup Strategy**:
   - Database backups
   - Configuration backups
   - SSL certificate backups

### 9. Troubleshooting

#### Common Issues:

1. **SSL Certificate Issues**:
   ```bash
   sudo certbot certificates
   sudo certbot renew --force-renewal
   ```

2. **Service Not Starting**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs [service-name]
   ```

3. **CORS Issues**:
   - Check Nginx configuration
   - Verify CORS settings in services
   - Check browser console for errors

4. **Database Connection Issues**:
   - Verify MongoDB connection string
   - Check network connectivity
   - Verify credentials

## Summary

After following this guide, your backend services will be accessible at:
- **Main API**: `https://toprise.in`
- **User Service**: `https://toprise.in/api/users`
- **Product Service**: `https://toprise.in/api/category`
- **Order Service**: `https://toprise.in/api/orders`
- **Notification Service**: `https://toprise.in/api/notification`

All services are now configured to accept requests from `https://toprise.in` and `https://www.toprise.in` with proper CORS settings and SSL encryption.
