# Ticket Population with User and Order Details Implementation

## Overview
Enhanced the tickets system to automatically populate user and order details from their respective services. This provides comprehensive information about all users involved in tickets and complete order details when tickets are related to orders.

## Features Added

### 1. User Service Integration
- **Automatic User Fetching**: Fetches user details for all users referenced in tickets
- **Comprehensive Coverage**: Includes users from multiple sources (userRef, assigned_to, updated_by, remarks_updated_by, involved_users)
- **Efficient Batching**: Collects unique user IDs and fetches all user details in parallel
- **Error Handling**: Graceful handling of user service failures

### 2. Order Service Integration
- **Order Details Fetching**: Fetches complete order information when tickets are related to orders
- **Rich Order Data**: Includes order number, status, amount, items, delivery address, and payment status
- **Conditional Population**: Only fetches order details when order_id exists in the ticket

### 3. Enhanced Response Structure
Each ticket now includes:
- **`userDetails`**: Complete user information map for all referenced users
- **`userRefDetails`**: Direct reference to the user who created the ticket
- **`assignedToDetails`**: Direct reference to the assigned user
- **`updatedByDetails`**: Direct reference to the user who last updated the ticket
- **`remarksUpdatedByDetails`**: Direct reference to the user who last updated remarks
- **`involvedUsersDetails`**: Array of all involved users with their details
- **`orderDetails`**: Complete order information when ticket is related to an order

## Implementation Details

### User Service Helper Function
```javascript
const fetchUserDetails = async (userId, authHeader) => {
  try {
    if (!userId || !authHeader) {
      return null;
    }

    const userResponse = await axios.get(
      `${USER_SERVICE_URL}/api/users/${userId}`,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
    
    if (userResponse.data && userResponse.data.success && userResponse.data.data) {
      return {
        _id: userResponse.data.data._id,
        username: userResponse.data.data.username,
        email: userResponse.data.data.email,
        role: userResponse.data.data.role,
        first_name: userResponse.data.data.first_name,
        last_name: userResponse.data.data.last_name,
        phone: userResponse.data.data.phone,
        status: userResponse.data.data.status,
      };
    }
    return null;
  } catch (error) {
    // Comprehensive error handling
    return null;
  }
};
```

### Order Service Helper Function
```javascript
const fetchOrderDetails = async (orderId, authHeader) => {
  try {
    if (!orderId || !authHeader) {
      return null;
    }

    const orderResponse = await axios.get(
      `${ORDER_SERVICE_URL}/api/orders/${orderId}`,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
    
    if (orderResponse.data && orderResponse.data.success && orderResponse.data.data) {
      return {
        _id: orderResponse.data.data._id,
        order_number: orderResponse.data.data.order_number,
        status: orderResponse.data.data.status,
        total_amount: orderResponse.data.data.total_amount,
        order_date: orderResponse.data.data.order_date,
        delivery_address: orderResponse.data.data.delivery_address,
        payment_status: orderResponse.data.data.payment_status,
        items: orderResponse.data.data.items,
      };
    }
    return null;
  } catch (error) {
    // Comprehensive error handling
    return null;
  }
};
```

### Ticket Population Helper Function
```javascript
const populateTicketDetails = async (ticket, authHeader) => {
  try {
    const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
    
    // Collect unique user IDs from the ticket
    const userIds = new Set();
    if (ticket.userRef) userIds.add(ticket.userRef);
    if (ticket.assigned_to) userIds.add(ticket.assigned_to);
    if (ticket.updated_by) userIds.add(ticket.updated_by);
    if (ticket.remarks_updated_by) userIds.add(ticket.remarks_updated_by);
    
    // Add user IDs from involved_users
    if (ticket.involved_users && ticket.involved_users.length > 0) {
      ticket.involved_users.forEach(userId => {
        if (userId) userIds.add(userId);
      });
    }

    // Fetch user details for all unique user IDs
    const userDetails = {};
    if (userIds.size > 0 && authHeader) {
      const userPromises = Array.from(userIds).map(async (userId) => {
        const userData = await fetchUserDetails(userId, authHeader);
        return { userId, userData };
      });

      const userResults = await Promise.all(userPromises);
      userResults.forEach(({ userId, userData }) => {
        if (userData) {
          userDetails[userId] = userData;
        }
      });
    }

    // Fetch order details if order_id exists
    let orderDetails = null;
    if (ticket.order_id && authHeader) {
      orderDetails = await fetchOrderDetails(ticket.order_id, authHeader);
    }

    // Add user details to the ticket object
    ticketObj.userDetails = userDetails;
    
    // Add specific user references for easy access
    if (ticket.userRef && userDetails[ticket.userRef]) {
      ticketObj.userRefDetails = userDetails[ticket.userRef];
    }
    
    if (ticket.assigned_to && userDetails[ticket.assigned_to]) {
      ticketObj.assignedToDetails = userDetails[ticket.assigned_to];
    }

    if (ticket.updated_by && userDetails[ticket.updated_by]) {
      ticketObj.updatedByDetails = userDetails[ticket.updated_by];
    }

    if (ticket.remarks_updated_by && userDetails[ticket.remarks_updated_by]) {
      ticketObj.remarksUpdatedByDetails = userDetails[ticket.remarks_updated_by];
    }

    // Add involved users details
    if (ticket.involved_users && ticket.involved_users.length > 0) {
      ticketObj.involvedUsersDetails = ticket.involved_users
        .map(userId => userDetails[userId])
        .filter(user => user !== undefined);
    }

    // Add order details
    if (orderDetails) {
      ticketObj.orderDetails = orderDetails;
    }

    return ticketObj;
  } catch (error) {
    logger.error(`Error populating ticket details: ${error.message}`);
    return ticket.toObject ? ticket.toObject() : ticket;
  }
};
```

## Updated Endpoints

### All Ticket Retrieval Endpoints Enhanced
1. **`getTicketById`** - Single ticket with populated details
2. **`getTicketByUserRef`** - Tickets by user with populated details
3. **`getAllTickets`** - All tickets with populated details
4. **`getTicketByAssignedUserRef`** - Tickets by assigned user with populated details
5. **`getTicketByInvolvedUserRef`** - Tickets by involved user with populated details

### Example Usage
```http
GET /api/tickets/
Authorization: Bearer <token>

GET /api/tickets/byId/ticket_id
Authorization: Bearer <token>

GET /api/tickets/byUser/user_id
Authorization: Bearer <token>
```

## Response Format

### Enhanced Response Structure
```json
{
  "success": true,
  "message": "Ticket retrieved successfully",
  "data": {
    "_id": "ticket_id",
    "userRef": "user_id_123",
    "assigned_to": "admin_user_456",
    "updated_by": "support_user_789",
    "remarks_updated_by": "admin_user_456",
    "involved_users": ["user_id_123", "support_user_789"],
    "description": "Issue with order delivery",
    "status": "In Progress",
    "ticketType": "Order",
    "order_id": "order_id_123",
    "remarks": "Issue has been escalated to delivery team",
    "attachments": [],
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    
    // Enhanced user details
    "userDetails": {
      "user_id_123": {
        "_id": "user_id_123",
        "username": "john_doe",
        "email": "john@example.com",
        "role": "User",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1234567890",
        "status": "active"
      },
      "admin_user_456": {
        "_id": "admin_user_456",
        "username": "admin_user",
        "email": "admin@example.com",
        "role": "Super-admin",
        "first_name": "Admin",
        "last_name": "User",
        "phone": "+0987654321",
        "status": "active"
      }
    },
    
    // Direct user references for easy access
    "userRefDetails": {
      "_id": "user_id_123",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "User",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "status": "active"
    },
    
    "assignedToDetails": {
      "_id": "admin_user_456",
      "username": "admin_user",
      "email": "admin@example.com",
      "role": "Super-admin",
      "first_name": "Admin",
      "last_name": "User",
      "phone": "+0987654321",
      "status": "active"
    },
    
    "updatedByDetails": {
      "_id": "support_user_789",
      "username": "support_user",
      "email": "support@example.com",
      "role": "Customer-Support",
      "first_name": "Support",
      "last_name": "Agent",
      "phone": "+1122334455",
      "status": "active"
    },
    
    "remarksUpdatedByDetails": {
      "_id": "admin_user_456",
      "username": "admin_user",
      "email": "admin@example.com",
      "role": "Super-admin",
      "first_name": "Admin",
      "last_name": "User",
      "phone": "+0987654321",
      "status": "active"
    },
    
    // Array of involved users with details
    "involvedUsersDetails": [
      {
        "_id": "user_id_123",
        "username": "john_doe",
        "email": "john@example.com",
        "role": "User",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1234567890",
        "status": "active"
      },
      {
        "_id": "support_user_789",
        "username": "support_user",
        "email": "support@example.com",
        "role": "Customer-Support",
        "first_name": "Support",
        "last_name": "Agent",
        "phone": "+1122334455",
        "status": "active"
      }
    ],
    
    // Order details (only present for Order-type tickets)
    "orderDetails": {
      "_id": "order_id_123",
      "order_number": "ORD-2024-001234",
      "status": "Processing",
      "total_amount": 299.99,
      "order_date": "2024-01-15T08:30:00Z",
      "payment_status": "Paid",
      "delivery_address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "items": [
        {
          "product_id": "product_123",
          "product_name": "Motorcycle Brake Pad",
          "quantity": 2,
          "price": 149.99,
          "total": 299.98
        }
      ]
    }
  }
}
```

## User Details Access Patterns

### 1. Direct User References
```javascript
// Access the user who created the ticket
const creator = ticket.userRefDetails;
console.log(`Created by: ${creator.first_name} ${creator.last_name}`);

// Access the assigned user
const assigned = ticket.assignedToDetails;
if (assigned) {
  console.log(`Assigned to: ${assigned.first_name} ${assigned.last_name} (${assigned.role})`);
}

// Access the user who last updated the ticket
const updatedBy = ticket.updatedByDetails;
if (updatedBy) {
  console.log(`Last updated by: ${updatedBy.first_name} ${updatedBy.last_name}`);
}
```

### 2. User Details Map
```javascript
// Access any user by their ID
const userDetails = ticket.userDetails;
const userId = ticket.userRef;
const user = userDetails[userId];
console.log(`User: ${user.first_name} ${user.last_name} (${user.role})`);
```

### 3. Involved Users Array
```javascript
// Access all involved users with details
ticket.involvedUsersDetails.forEach((user, index) => {
  console.log(`Involved user ${index + 1}: ${user.first_name} ${user.last_name} (${user.role})`);
});
```

### 4. Order Details Access
```javascript
// Access order details for Order-type tickets
if (ticket.orderDetails) {
  console.log(`Order: ${ticket.orderDetails.order_number}`);
  console.log(`Status: ${ticket.orderDetails.status}`);
  console.log(`Amount: $${ticket.orderDetails.total_amount}`);
  console.log(`Payment: ${ticket.orderDetails.payment_status}`);
  
  // Access order items
  ticket.orderDetails.items.forEach(item => {
    console.log(`Item: ${item.product_name} - Qty: ${item.quantity} - Price: $${item.price}`);
  });
}
```

## Performance Considerations

### Optimization Features
1. **Parallel User Fetching**: All user details are fetched in parallel using `Promise.all()`
2. **Unique User Collection**: Uses `Set` to avoid duplicate user ID requests
3. **Timeout Handling**: 5-second timeout for service requests
4. **Error Resilience**: Continues processing even if some details fail to load
5. **Conditional Population**: Only fetches order details when order_id exists

### Performance Impact
- **Additional API Calls**: One call to user service per unique user ID, one call to order service per order
- **Response Time**: Slightly increased due to service integration
- **Memory Usage**: Additional user and order data in response
- **Network Overhead**: Additional data transfer

## Error Handling

### Service Failures
```javascript
try {
  const userData = await fetchUserDetails(userId, authHeader);
  return userData;
} catch (error) {
  if (error.response) {
    if (error.response.status === 401) {
      logger.warn(`Authorization failed for user ${userId} - token may be invalid or expired`);
    } else if (error.response.status === 404) {
      logger.warn(`User ${userId} not found in user service`);
    } else if (error.response.status === 403) {
      logger.warn(`Access forbidden for user ${userId} - insufficient permissions`);
    }
  }
  return null;
}
```

### Graceful Degradation
- If user service is unavailable, tickets are still returned without user details
- If order service is unavailable, tickets are still returned without order details
- Individual service failures don't affect other services
- Logs warnings for failed service calls
- Maintains API response structure

## Security Considerations

### Authorization
- Passes through the original authorization header to user and order services
- Respects service authentication and authorization
- Only fetches details for resources the requester has access to

### Data Privacy
- Only includes relevant user and order fields
- Respects service data access policies
- Maintains existing ticket data access controls

## Testing

### Test Script
A comprehensive test script `test-ticket-population.js` has been created to verify:
1. All tickets retrieval with populated details
2. Single ticket retrieval with populated details
3. Tickets by user reference with populated details
4. Filtered tickets with populated details
5. Error handling for invalid requests

### Manual Testing
```bash
# Test all tickets with populated details
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5003/api/tickets/"

# Test single ticket with populated details
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5003/api/tickets/byId/ticket_id"

# Test tickets by user with populated details
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5003/api/tickets/byUser/user_id"
```

## Backward Compatibility

### Existing Functionality
- All existing query parameters continue to work
- Filtering and sorting functionality remains unchanged
- Response structure is enhanced, not replaced
- All existing ticket data is preserved

### New Features
- User and order details are additive - doesn't break existing integrations
- Optional enhancement - existing clients can ignore new fields
- Maintains all existing ticket functionality

## Future Enhancements

### Potential Improvements
1. **User Caching**: Implement caching for frequently accessed users
2. **Selective Population**: Allow clients to specify which details to include
3. **Service Health Check**: Check service availability before making requests
4. **Batch Service Calls**: Optimize service calls with batch endpoints
5. **Details Filtering**: Filter details based on client permissions

### Performance Optimizations
1. **Connection Pooling**: Optimize HTTP connections to services
2. **Response Compression**: Compress large responses with populated details
3. **Lazy Loading**: Load details only when requested
4. **Database Joins**: Consider database-level joins for better performance

## Dependencies

### Required Services
- **User Service**: Must be running and accessible
- **Order Service**: Must be running and accessible (for Order-type tickets)
- **Ticket Service**: Enhanced with service integration
- **Network**: Reliable network connection between services

### Service Configuration
- User service URL: `http://user-service:5001`
- Order service URL: `http://order-service:5003`
- Timeout: 5 seconds for service requests
- Authorization: Pass-through from original request

## Monitoring

### Key Metrics to Monitor
- User service response times
- Order service response times
- Service failure rates
- Population success rates

### Alerts to Set Up
- High service failure rates
- Service unavailability
- Population timeout issues
- Service response time degradation

## Conclusion

The ticket population functionality provides comprehensive user and order context for all tickets. It maintains proper authorization, includes comprehensive error handling, and integrates seamlessly with existing services. The implementation is designed to be extensible for future enhancements while maintaining backward compatibility with existing tickets and clients.
