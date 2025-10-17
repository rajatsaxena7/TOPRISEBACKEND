const axios = require('axios');

// Test script for notification count endpoints
async function testNotificationCountEndpoints() {
    console.log('🧪 Testing Notification Count Endpoints...\n');

    const baseURL = 'http://localhost:5001'; // Notification service URL
    const testUserId = 'test-user-123';
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    try {
        // Test 1: Get unread notification count
        console.log('1. Testing unread notification count endpoint...');
        const unreadCountResponse = await axios.get(
            `${baseURL}/api/notification/unread-count/${testUserId}`,
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (unreadCountResponse.data.success) {
            console.log('✅ Unread count endpoint working');
            console.log('📊 Response:', JSON.stringify(unreadCountResponse.data.data, null, 2));
        } else {
            console.log('❌ Unread count endpoint failed:', unreadCountResponse.data.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: Get comprehensive notification stats
        console.log('2. Testing notification stats endpoint...');
        const statsResponse = await axios.get(
            `${baseURL}/api/notification/stats/${testUserId}`,
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (statsResponse.data.success) {
            console.log('✅ Stats endpoint working');
            console.log('📊 Response:', JSON.stringify(statsResponse.data.data, null, 2));
        } else {
            console.log('❌ Stats endpoint failed:', statsResponse.data.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 3: Create some test notifications to verify count updates
        console.log('3. Testing notification creation and count updates...');

        // Create test notifications
        const testNotifications = [
            {
                userIds: [testUserId],
                notificationType: ["INAPP"],
                notificationTitle: "Test Notification 1",
                NotificationBody: "This is a test notification to verify count functionality",
                deepLink: "",
                webRoute: "",
                notification_type: "Order",
                references: { test: true }
            },
            {
                userIds: [testUserId],
                notificationType: ["INAPP"],
                notificationTitle: "Test Notification 2",
                NotificationBody: "Another test notification",
                deepLink: "",
                webRoute: "",
                notification_type: "Product",
                references: { test: true }
            }
        ];

        for (let i = 0; i < testNotifications.length; i++) {
            const createResponse = await axios.post(
                `${baseURL}/api/notification/createUniCastOrMulticast`,
                testNotifications[i],
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (createResponse.data.success) {
                console.log(`✅ Test notification ${i + 1} created successfully`);
            } else {
                console.log(`❌ Failed to create test notification ${i + 1}:`, createResponse.data.message);
            }
        }

        // Wait a moment for notifications to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check count after creating notifications
        console.log('\n4. Checking count after creating test notifications...');
        const updatedCountResponse = await axios.get(
            `${baseURL}/api/notification/unread-count/${testUserId}`,
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (updatedCountResponse.data.success) {
            console.log('✅ Updated count retrieved');
            console.log('📊 Updated Response:', JSON.stringify(updatedCountResponse.data.data, null, 2));
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 4: Mark one notification as read and check count
        console.log('5. Testing mark as read functionality...');

        // First get all notifications to find an ID
        const allNotificationsResponse = await axios.get(
            `${baseURL}/api/notification/all_userNotifications/${testUserId}`,
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (allNotificationsResponse.data.success && allNotificationsResponse.data.data.length > 0) {
            const firstNotificationId = allNotificationsResponse.data.data[0]._id;

            // Mark as read
            const markReadResponse = await axios.put(
                `${baseURL}/api/notification/markAsRead/${firstNotificationId}`,
                {},
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (markReadResponse.data.success) {
                console.log('✅ Notification marked as read');

                // Check count again
                const finalCountResponse = await axios.get(
                    `${baseURL}/api/notification/unread-count/${testUserId}`,
                    {
                        headers: {
                            'Authorization': authToken,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (finalCountResponse.data.success) {
                    console.log('✅ Final count after marking as read:');
                    console.log('📊 Final Response:', JSON.stringify(finalCountResponse.data.data, null, 2));
                }
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n🔍 Frontend Integration Guide:');
    console.log('1. Call GET /api/notification/unread-count/{userId} to get count');
    console.log('2. Display count as badge on notification bell icon');
    console.log('3. Update count when notifications are marked as read');
    console.log('4. Poll endpoint periodically or use WebSocket for real-time updates');
    console.log('5. Use /api/notification/stats/{userId} for detailed statistics');
}

// Run the test
testNotificationCountEndpoints();
