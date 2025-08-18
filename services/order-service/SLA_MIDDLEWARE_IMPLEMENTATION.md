# SLA Violation Middleware Implementation

This document describes the implementation of an automated SLA (Service Level Agreement) violation detection system using middleware that continuously monitors orders and automatically records violations when dealers fail to fulfill orders within their assigned time ranges.

## Overview

The SLA violation middleware system provides:
- **Automatic Monitoring**: Continuously checks all active orders for SLA violations
- **Real-time Detection**: Detects violations as soon as they occur
- **Scheduled Checks**: Runs periodic checks every 15 minutes
- **Warning System**: Alerts dealers about orders approaching SLA violation
- **Comprehensive Reporting**: Daily reports and violation summaries

## Architecture

### Components

1. **SLA Violation Middleware** (`slaViolationMiddleware.js`)
   - Core logic for checking SLA violations
   - Handles individual order checks
   - Manages violation recording and order updates

2. **SLA Violation Scheduler** (`slaViolationScheduler.js`)
   - Automated scheduling of violation checks
   - Warning notifications for approaching violations
   - Daily report generation

3. **Enhanced Controllers**
   - Updated order controllers with middleware integration
   - Scheduler management endpoints
   - Violation reporting endpoints

## How It Works

### 1. Automatic SLA Monitoring

The system automatically monitors all active orders:

```javascript
// Runs every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  const result = await slaViolationMiddleware.checkAllActiveOrders();
  // Processes all active orders and records violations
});
```

### 2. Violation Detection Process

For each active order:

1. **Get Dealer SLA Configuration**: Retrieve SLA settings for assigned dealers
2. **Calculate Expected Time**: Determine when the order should be fulfilled
3. **Check Current Status**: Compare current time with expected fulfillment time
4. **Record Violation**: If exceeded, automatically record the violation
5. **Update Order**: Mark order with violation information

### 3. Expected Fulfillment Time Calculation

```
Expected Time = Order Date + SLA Hours + Dispatch Hours Adjustment
```

- **SLA Hours**: From dealer's SLA type configuration
- **Dispatch Hours**: Only count hours within dealer's operational window
- **Adjustment**: Adjust to next available time if outside dispatch hours

## API Endpoints

### SLA Violation Management

#### Get Orders Approaching SLA Violation
```http
GET /api/orders/sla/violations/approaching?warningMinutes=30
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "ORD-123",
      "order_id": "507f1f77bcf86cd799439011",
      "dealerId": "dealer123",
      "expectedFulfillmentTime": "2024-01-15T10:00:00Z",
      "minutesUntilViolation": 15,
      "orderStatus": "Confirmed"
    }
  ]
}
```

### Scheduler Management

#### Start SLA Scheduler
```http
POST /api/orders/sla/scheduler/start
```

#### Stop SLA Scheduler
```http
POST /api/orders/sla/scheduler/stop
```

#### Get Scheduler Status
```http
GET /api/orders/sla/scheduler/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "scheduledJobs": ["slaViolationCheck", "slaWarningCheck", "dailyReport"],
    "jobCount": 3
  }
}
```

#### Trigger Manual Check
```http
POST /api/orders/sla/scheduler/trigger-check
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processedCount": 150,
    "violationCount": 5
  }
}
```

## Configuration

### Setting Up SLA Types

```javascript
// Create SLA Type
POST /api/orders/sla/types
{
  "name": "Express",
  "description": "Express delivery within 2 hours",
  "expected_hours": 2
}
```

### Configuring Dealer SLA

```javascript
// Set Dealer SLA
POST /api/orders/dealers/:dealerId/sla
{
  "sla_type_id": "slaTypeId",
  "dispatch_hours": {
    "start": 9,
    "end": 18
  }
}
```

## Scheduling Configuration

### Automatic Checks

The system runs several scheduled tasks:

1. **SLA Violation Check**: Every 15 minutes
   - Checks all active orders for violations
   - Records violations automatically

2. **Warning Check**: Every 5 minutes
   - Identifies orders approaching SLA violation
   - Sends warning notifications to dealers

3. **Daily Report**: Every day at 9 AM
   - Generates comprehensive violation report
   - Sends summary to administrators

### Customizing Schedules

You can modify the schedules in `slaViolationScheduler.js`:

```javascript
// Change violation check frequency (every 10 minutes)
cron.schedule('*/10 * * * *', async () => {
  // SLA violation check logic
});

// Change warning check frequency (every 3 minutes)
cron.schedule('*/3 * * * *', async () => {
  // Warning check logic
});

// Change daily report time (every day at 6 PM)
cron.schedule('0 18 * * *', async () => {
  // Daily report logic
});
```

## Middleware Integration

### Order Status Updates

The middleware is automatically applied to order status update endpoints:

```javascript
// Status updates (with SLA violation middleware)
router.post("/:orderId/pack", slaViolationMiddleware.checkSLAOnOrderUpdate(), orderController.markAsPacked);
router.post("/:orderId/deliver", slaViolationMiddleware.checkSLAOnOrderUpdate(), orderController.markAsDelivered);
router.post("/:orderId/cancel", slaViolationMiddleware.checkSLAOnOrderUpdate(), orderController.cancelOrder);
```

### Background Processing

The middleware runs SLA checks in the background to avoid blocking API requests:

```javascript
// Run SLA check in background (don't block the request)
setImmediate(async () => {
  try {
    await this.checkOrderSLAViolation(order);
  } catch (error) {
    logger.error(`Background SLA check failed for order ${orderId}:`, error);
  }
});
```

## Notification System

### Warning Notifications

The system can send notifications to dealers about orders approaching SLA violation:

```javascript
// Example notification payload
const notificationPayload = {
  dealerId: "dealer123",
  violations: [
    {
      orderId: "ORD-123",
      minutesUntilViolation: 15,
      expectedFulfillmentTime: "2024-01-15T10:00:00Z"
    }
  ],
  message: "You have 1 order(s) approaching SLA violation. Please prioritize these orders."
};
```

### Daily Reports

Daily violation reports include:

- Total violations for the day
- Average violation minutes
- Violations by dealer
- Summary statistics

## Monitoring and Logging

### Logging

The system provides comprehensive logging:

```javascript
// Violation detection
logger.info(`SLA violation recorded for order ${orderId}, dealer ${dealerId}: ${violationMinutes} minutes late`);

// Scheduled checks
logger.info(`Scheduled SLA check completed: ${processedCount} orders processed, ${violationCount} violations found`);

// Warning notifications
logger.warn(`Found ${approachingViolations.length} orders approaching SLA violation`);
```

### Metrics

Track key metrics:

- **Violation Rate**: Percentage of orders with SLA violations
- **Average Violation Time**: Mean minutes of violation
- **Dealer Performance**: Violations per dealer
- **Response Time**: Time to resolve violations

## Testing

### Run Middleware Test

```bash
cd services/order-service
node test-sla-middleware.js
```

The test script will:
1. Create test SLA types and dealer configurations
2. Create orders with past dates to simulate delays
3. Test middleware SLA violation detection
4. Verify violation recording and order updates
5. Test scheduler functionality
6. Clean up test data

### Manual Testing

You can manually trigger SLA checks:

```bash
# Trigger manual SLA check
curl -X POST http://localhost:5001/api/orders/sla/scheduler/trigger-check

# Get scheduler status
curl -X GET http://localhost:5001/api/orders/sla/scheduler/status

# Get approaching violations
curl -X GET "http://localhost:5001/api/orders/sla/violations/approaching?warningMinutes=30"
```

## Error Handling

### Graceful Degradation

The system handles errors gracefully:

- **Database Errors**: Logged but don't stop the scheduler
- **Network Issues**: Retry mechanisms for external service calls
- **Invalid Data**: Skip problematic orders and continue processing

### Error Recovery

```javascript
try {
  await this.checkOrderSLAViolation(order);
} catch (error) {
  logger.error(`Error checking SLA for order ${order.orderId}:`, error);
  // Continue with next order
}
```

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Process orders in batches to reduce database load
2. **Indexing**: Ensure proper database indexes for SLA queries
3. **Caching**: Cache dealer SLA configurations
4. **Background Processing**: Run checks asynchronously

### Scalability

The system is designed to scale:

- **Horizontal Scaling**: Multiple instances can run simultaneously
- **Database Optimization**: Efficient queries and indexing
- **Resource Management**: Configurable check intervals

## Security

### Access Control

- **Authentication**: All endpoints require proper authentication
- **Authorization**: Role-based access to scheduler controls
- **Audit Logging**: All SLA violations are logged with timestamps

### Data Protection

- **Encryption**: Sensitive data is encrypted at rest
- **Validation**: Input validation for all API endpoints
- **Sanitization**: Data sanitization to prevent injection attacks

## Deployment

### Environment Variables

Configure the system with environment variables:

```bash
# Database configuration
MONGO_URI=mongodb://localhost:27017/your_database

# Scheduler configuration
SLA_CHECK_INTERVAL=15  # minutes
SLA_WARNING_INTERVAL=5  # minutes
SLA_DAILY_REPORT_TIME=9  # hour (24-hour format)

# Timezone
TZ=Asia/Kolkata
```

### Docker Deployment

```dockerfile
# Add to your Dockerfile
RUN npm install node-cron
```

### Health Checks

Monitor the scheduler health:

```bash
# Check scheduler status
curl -X GET http://localhost:5001/api/orders/sla/scheduler/status

# Check system health
curl -X GET http://localhost:5001/health
```

## Troubleshooting

### Common Issues

1. **Scheduler Not Starting**
   - Check MongoDB connection
   - Verify node-cron installation
   - Check timezone configuration

2. **Violations Not Detected**
   - Verify dealer SLA configuration
   - Check order dates and timestamps
   - Review dispatch hours settings

3. **Performance Issues**
   - Reduce check frequency
   - Optimize database queries
   - Add proper indexing

### Debug Mode

Enable debug logging:

```javascript
// Set log level to debug
logger.level = 'debug';
```

## Future Enhancements

### Planned Features

1. **Email Notifications**: Send violation alerts via email
2. **SMS Alerts**: Real-time SMS notifications
3. **Dashboard Integration**: Real-time violation dashboard
4. **Escalation Rules**: Automatic escalation for repeated violations
5. **Machine Learning**: Predictive violation detection

### Integration Points

- **Notification Service**: For email/SMS alerts
- **Analytics Platform**: For violation analytics
- **Dashboard**: For real-time monitoring
- **CRM System**: For customer communication
