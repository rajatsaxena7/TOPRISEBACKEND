# Notification Count Endpoints Documentation

## Overview
This documentation describes the new notification count endpoints that provide unread notification counts and statistics for the notification bell icon in the navigation bar.

## Problem Solved
Previously, users had no visual indicator of unread notifications on the notification bell icon. They had to manually click the bell to see if there were new notifications, defeating the purpose of real-time alerts.

## New Endpoints

### 1. Get Unread Notification Count
**Endpoint:** `GET /api/notification/unread-count/{userId}`

**Description:** Returns the count of unread notifications for a specific user.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parameters:**
- `userId` (path parameter): The ID of the user

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5,
    "totalCount": 12,
    "readCount": 7,
    "userId": "user-123"
  },
  "message": "Unread notification count fetched successfully"
}
```

**Response Fields:**
- `unreadCount`: Number of unread notifications
- `totalCount`: Total number of notifications (read + unread)
- `readCount`: Number of read notifications
- `userId`: The user ID for which the count was fetched

### 2. Get Notification Statistics
**Endpoint:** `GET /api/notification/stats/{userId}`

**Description:** Returns comprehensive notification statistics for a specific user.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parameters:**
- `userId` (path parameter): The ID of the user

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCount": 12,
    "unreadCount": 5,
    "readCount": 7,
    "latestNotification": "2024-01-15T10:30:00.000Z",
    "oldestUnreadNotification": "2024-01-14T08:15:00.000Z",
    "userId": "user-123"
  },
  "message": "Notification statistics fetched successfully"
}
```

**Response Fields:**
- `totalCount`: Total number of notifications
- `unreadCount`: Number of unread notifications
- `readCount`: Number of read notifications
- `latestNotification`: Timestamp of the most recent notification
- `oldestUnreadNotification`: Timestamp of the oldest unread notification
- `userId`: The user ID for which the stats were fetched

## Frontend Integration

### 1. Basic Count Display
```javascript
// Fetch unread count
async function getUnreadCount(userId) {
  try {
    const response = await fetch(`/api/notification/unread-count/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update notification bell badge
      updateNotificationBadge(data.data.unreadCount);
    }
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
  }
}

// Update notification bell badge
function updateNotificationBadge(count) {
  const badge = document.getElementById('notification-badge');
  
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'block';
    badge.classList.add('notification-badge--active');
  } else {
    badge.style.display = 'none';
    badge.classList.remove('notification-badge--active');
  }
}
```

### 2. Real-time Updates
```javascript
// Poll for updates every 30 seconds
setInterval(() => {
  getUnreadCount(currentUserId);
}, 30000);

// Or use WebSocket for real-time updates
const ws = new WebSocket('ws://localhost:5001/notifications');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'notification_count_update') {
    updateNotificationBadge(data.count);
  }
};
```

### 3. React Component Example
```jsx
import React, { useState, useEffect } from 'react';

const NotificationBell = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/notification/unread-count/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notification-bell">
      <button className="bell-icon" onClick={openNotificationPanel}>
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
```

### 4. CSS Styling
```css
.notification-bell {
  position: relative;
  display: inline-block;
}

.bell-icon {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.notification-badge--active {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "message": "User not found",
  "error": "User with ID user-123 does not exist"
}
```

### Error Handling in Frontend
```javascript
async function getUnreadCount(userId) {
  try {
    const response = await fetch(`/api/notification/unread-count/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.unreadCount;
    } else {
      console.error('API error:', data.message);
      return 0;
    }
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return 0; // Default to 0 on error
  }
}
```

## Performance Considerations

### 1. Caching
```javascript
// Cache count for 30 seconds to reduce API calls
const countCache = new Map();

async function getCachedUnreadCount(userId) {
  const cacheKey = `count_${userId}`;
  const cached = countCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 30000) {
    return cached.count;
  }
  
  const count = await getUnreadCount(userId);
  countCache.set(cacheKey, {
    count,
    timestamp: Date.now()
  });
  
  return count;
}
```

### 2. Debouncing
```javascript
// Debounce rapid API calls
const debouncedFetchCount = debounce(getUnreadCount, 1000);

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

## Testing

### Manual Testing
1. Use the provided test script: `node test-notification-count-endpoints.js`
2. Create test notifications using the existing endpoints
3. Verify count updates when notifications are marked as read
4. Test with different user IDs

### Automated Testing
```javascript
// Jest test example
describe('Notification Count Endpoints', () => {
  test('should return unread count for valid user', async () => {
    const response = await request(app)
      .get('/api/notification/unread-count/test-user-123')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('unreadCount');
    expect(response.body.data).toHaveProperty('totalCount');
    expect(response.body.data).toHaveProperty('readCount');
  });
});
```

## Security Considerations

### 1. Authentication
- All endpoints require valid authentication token
- User can only access their own notification counts
- Implement proper token validation

### 2. Rate Limiting
```javascript
// Implement rate limiting to prevent abuse
const rateLimit = require('express-rate-limit');

const notificationCountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests for notification count'
});

app.use('/api/notification/unread-count', notificationCountLimiter);
```

## Monitoring and Logging

### 1. Logging
The endpoints log the following information:
- Successful count fetches with user ID and count
- Error messages for failed requests
- Performance metrics

### 2. Monitoring
Monitor the following metrics:
- API response times
- Error rates
- Request frequency per user
- Database query performance

## Future Enhancements

### 1. Real-time Updates
- Implement WebSocket connections for real-time count updates
- Use Server-Sent Events (SSE) for push notifications
- Integrate with Redis for real-time count caching

### 2. Advanced Features
- Notification categories with separate counts
- Priority-based notification counts
- Time-based notification filtering
- Bulk notification operations

### 3. Analytics
- Track notification engagement rates
- Monitor read/unread patterns
- Generate notification usage reports

## Summary

The new notification count endpoints provide:
- ✅ Real-time unread notification counts
- ✅ Visual indicators for the notification bell
- ✅ Comprehensive notification statistics
- ✅ Efficient database queries
- ✅ Proper error handling and logging
- ✅ Frontend integration examples
- ✅ Performance optimization strategies

This solves the original problem of users not knowing when new notifications arrive, providing a much better user experience with clear visual indicators.
