const axios = require('axios');

const PRODUCT_SERVICE_URL = 'http://localhost:5003';
const USER_SERVICE_URL = 'http://localhost:5001';

async function testProductApprovalFlow() {
  try {
    console.log('🔍 Testing Product Approval Flow...\n');

    // Step 1: Login as Inventory Staff (non-Super-admin)
    console.log('1️⃣ Logging in as Inventory Staff...');
    const staffLoginResponse = await axios.post(`${USER_SERVICE_URL}/api/users/login`, {
      email: 'inventory-staff@example.com',
      password: 'password123'
    });

    if (!staffLoginResponse.data.success) {
      console.log('❌ Staff login failed:', staffLoginResponse.data);
      return;
    }

    const staffToken = staffLoginResponse.data.data.token;
    const staffRole = staffLoginResponse.data.data.user.role;
    console.log('✅ Staff login successful');
    console.log('📋 Staff role:', staffRole);

    // Step 2: Create a test product as Inventory Staff (should require approval)
    console.log('\n2️⃣ Creating a test product as Inventory Staff...');
    
    const productData = {
      product_name: "Test Product - Staff Upload",
      manufacturer_part_name: "TEST-STAFF-001",
      category: "Test Category",
      sub_category: "Test Subcategory",
      brand: "Test Brand",
      product_type: "Regular",
      model: "Test Model",
      variant: "Test Variant",
      selling_price: 100,
      mrp: 120,
      description: "Test product created by Inventory Staff"
    };

    const productResponse = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/createProduct`, productData, {
      headers: {
        'Authorization': `Bearer ${staffToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!productResponse.data.success) {
      console.log('❌ Product creation failed:', productResponse.data);
      return;
    }

    const productId = productResponse.data.data._id;
    console.log('✅ Product created successfully');
    console.log('📋 Product ID:', productId);
    console.log('📋 Product status:', productResponse.data.data.live_status);
    console.log('📋 QC status:', productResponse.data.data.Qc_status);

    // Step 3: Login as Super Admin
    console.log('\n3️⃣ Logging in as Super Admin...');
    const adminLoginResponse = await axios.post(`${USER_SERVICE_URL}/api/users/login`, {
      email: 'super-admin@example.com',
      password: 'password123'
    });

    if (!adminLoginResponse.data.success) {
      console.log('❌ Admin login failed:', adminLoginResponse.data);
      return;
    }

    const adminToken = adminLoginResponse.data.data.token;
    const adminRole = adminLoginResponse.data.data.user.role;
    console.log('✅ Admin login successful');
    console.log('📋 Admin role:', adminRole);

    // Step 4: Get pending products
    console.log('\n4️⃣ Getting pending products...');
    
    const pendingResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/pending`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (pendingResponse.data.success) {
      console.log('✅ Pending products fetched successfully');
      console.log('📋 Pending products count:', pendingResponse.data.data.pagination.totalItems);
      
      if (pendingResponse.data.data.products.length > 0) {
        const firstPending = pendingResponse.data.data.products[0];
        console.log('📋 First pending product:', {
          id: firstPending._id,
          name: firstPending.product_name,
          status: firstPending.live_status,
          qcStatus: firstPending.Qc_status,
          createdBy: firstPending.created_by_role
        });
      }
    } else {
      console.log('❌ Failed to get pending products:', pendingResponse.data);
    }

    // Step 5: Approve the product
    console.log('\n5️⃣ Approving the product...');
    
    const approveResponse = await axios.patch(`${PRODUCT_SERVICE_URL}/api/products/approve/${productId}`, {
      reason: "Product meets quality standards"
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (approveResponse.data.success) {
      console.log('✅ Product approved successfully');
      console.log('📋 Updated status:', approveResponse.data.data.live_status);
      console.log('📋 Updated QC status:', approveResponse.data.data.Qc_status);
    } else {
      console.log('❌ Product approval failed:', approveResponse.data);
    }

    // Step 6: Create another product as Inventory Staff
    console.log('\n6️⃣ Creating another test product as Inventory Staff...');
    
    const productData2 = {
      product_name: "Test Product - Staff Upload 2",
      manufacturer_part_name: "TEST-STAFF-002",
      category: "Test Category",
      sub_category: "Test Subcategory",
      brand: "Test Brand",
      product_type: "Regular",
      model: "Test Model",
      variant: "Test Variant",
      selling_price: 150,
      mrp: 180,
      description: "Second test product created by Inventory Staff"
    };

    const productResponse2 = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/createProduct`, productData2, {
      headers: {
        'Authorization': `Bearer ${staffToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!productResponse2.data.success) {
      console.log('❌ Second product creation failed:', productResponse2.data);
      return;
    }

    const productId2 = productResponse2.data.data._id;
    console.log('✅ Second product created successfully');
    console.log('📋 Product ID:', productId2);

    // Step 7: Reject the second product
    console.log('\n7️⃣ Rejecting the second product...');
    
    const rejectResponse = await axios.patch(`${PRODUCT_SERVICE_URL}/api/products/reject/${productId2}`, {
      reason: "Product does not meet quality standards"
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (rejectResponse.data.success) {
      console.log('✅ Product rejected successfully');
      console.log('📋 Updated status:', rejectResponse.data.data.live_status);
      console.log('📋 Updated QC status:', rejectResponse.data.data.Qc_status);
      console.log('📋 Rejection reason:', rejectResponse.data.data.rejection_state[0].reason);
    } else {
      console.log('❌ Product rejection failed:', rejectResponse.data);
    }

    // Step 8: Get approval statistics
    console.log('\n8️⃣ Getting approval statistics...');
    
    const statsResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/approval/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (statsResponse.data.success) {
      console.log('✅ Approval statistics fetched successfully');
      console.log('📋 Statistics:', statsResponse.data.data);
    } else {
      console.log('❌ Failed to get approval statistics:', statsResponse.data);
    }

    // Step 9: Test bulk upload as Inventory Staff
    console.log('\n9️⃣ Testing bulk upload as Inventory Staff...');
    
    // Note: This would require actual Excel and ZIP files
    // For testing purposes, we'll just verify the endpoint exists
    console.log('📋 Bulk upload endpoint: POST /api/products/');
    console.log('📋 This would require Excel file and ZIP file upload');

    // Step 10: Test Super Admin direct upload (should be auto-approved)
    console.log('\n🔟 Testing Super Admin direct upload...');
    
    const adminProductData = {
      product_name: "Test Product - Admin Direct",
      manufacturer_part_name: "TEST-ADMIN-001",
      category: "Test Category",
      sub_category: "Test Subcategory",
      brand: "Test Brand",
      product_type: "Regular",
      model: "Test Model",
      variant: "Test Variant",
      selling_price: 200,
      mrp: 240,
      description: "Test product created by Super Admin (should be auto-approved)"
    };

    const adminProductResponse = await axios.post(`${PRODUCT_SERVICE_URL}/api/products/createProduct`, adminProductData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (adminProductResponse.data.success) {
      console.log('✅ Admin product created successfully');
      console.log('📋 Product ID:', adminProductResponse.data.data._id);
      console.log('📋 Status (should be Approved):', adminProductResponse.data.data.live_status);
      console.log('📋 QC Status (should be Approved):', adminProductResponse.data.data.Qc_status);
    } else {
      console.log('❌ Admin product creation failed:', adminProductResponse.data);
    }

  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('📊 Status:', error.response?.status);
    console.log('📊 Data:', error.response?.data);
    console.log('📊 Message:', error.response?.data?.message || error.message);
  }
}

async function testBulkApprovalFlow() {
  try {
    console.log('\n🔍 Testing Bulk Approval Flow...\n');

    // Login as Super Admin
    console.log('1️⃣ Logging in as Super Admin...');
    const adminLoginResponse = await axios.post(`${USER_SERVICE_URL}/api/users/login`, {
      email: 'super-admin@example.com',
      password: 'password123'
    });

    if (!adminLoginResponse.data.success) {
      console.log('❌ Admin login failed:', adminLoginResponse.data);
      return;
    }

    const adminToken = adminLoginResponse.data.data.token;
    console.log('✅ Admin login successful');

    // Get pending products
    const pendingResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/pending`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!pendingResponse.data.success) {
      console.log('❌ Failed to get pending products');
      return;
    }

    const pendingProducts = pendingResponse.data.data.products;
    if (pendingProducts.length === 0) {
      console.log('📋 No pending products to test bulk approval');
      return;
    }

    // Test bulk approval
    console.log('2️⃣ Testing bulk approval...');
    const productIds = pendingProducts.slice(0, 2).map(p => p._id); // Take first 2 products
    
    const bulkApproveResponse = await axios.patch(`${PRODUCT_SERVICE_URL}/api/products/bulk/approve`, {
      productIds: productIds,
      reason: "Bulk approval test"
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (bulkApproveResponse.data.success) {
      console.log('✅ Bulk approval successful');
      console.log('📋 Results:', bulkApproveResponse.data.data);
    } else {
      console.log('❌ Bulk approval failed:', bulkApproveResponse.data);
    }

  } catch (error) {
    console.log('❌ Bulk approval error:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Product Approval Flow Tests...\n');
  
  await testProductApprovalFlow();
  await testBulkApprovalFlow();
  
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);
