#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Order Audit Testing Environment...\n');

// Create test configuration
const testConfig = {
  orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:5002',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  testUsers: {
    'Super-admin': {
      id: '507f1f77bcf86cd799439011',
      role: 'Super-admin',
      name: 'Super Admin User',
      email: 'superadmin@test.com'
    },
    'Fulfillment-Admin': {
      id: '507f1f77bcf86cd799439012',
      role: 'Fulfillment-Admin',
      name: 'Fulfillment Admin User',
      email: 'fulfillment@test.com'
    },
    'Inventory-Admin': {
      id: '507f1f77bcf86cd799439013',
      role: 'Inventory-Admin',
      name: 'Inventory Admin User',
      email: 'inventory@test.com'
    },
    'Dealer': {
      id: '507f1f77bcf86cd799439014',
      role: 'Dealer',
      name: 'Dealer User',
      email: 'dealer@test.com'
    }
  }
};

// Create .env file for testing
const envContent = `# Order Service Testing Configuration
ORDER_SERVICE_URL=${testConfig.orderServiceUrl}
JWT_SECRET=${testConfig.jwtSecret}

# Test User IDs
SUPER_ADMIN_ID=${testConfig.testUsers['Super-admin'].id}
FULFILLMENT_ADMIN_ID=${testConfig.testUsers['Fulfillment-Admin'].id}
INVENTORY_ADMIN_ID=${testConfig.testUsers['Inventory-Admin'].id}
DEALER_ID=${testConfig.testUsers['Dealer'].id}
`;

// Create package.json for testing dependencies
const packageJson = {
  name: "order-audit-testing",
  version: "1.0.0",
  description: "Testing environment for order audit logging",
  main: "test-order-audit-endpoints.js",
  scripts: {
    "test": "node test-order-audit-endpoints.js",
    "test:manual": "node test-order-logging-system.js",
    "setup": "node setup-order-testing.js"
  },
  dependencies: {
    "axios": "^1.6.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0"
  },
  devDependencies: {
    "nodemon": "^3.0.0"
  }
};

// Create test data file
const testData = {
  orderData: {
    customerId: 'CUST-TEST-001',
    customerName: 'Test Customer',
    customerEmail: 'customer@test.com',
    customerPhone: '+1234567890',
    customerAddress: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '12345',
      country: 'Test Country'
    },
    totalAmount: 1500.00,
    delivery_type: 'Express',
    skus: [
      {
        sku: 'SKU-TEST-001',
        quantity: 2,
        productId: 'PROD-001',
        productName: 'Test Product 1',
        selling_price: 500.00,
        mrp: 600.00,
        mrp_gst_amount: 108.00,
        gst_percentage: 18,
        gst_amount: 90.00,
        product_total: 590.00,
        totalPrice: 1180.00
      },
      {
        sku: 'SKU-TEST-002',
        quantity: 1,
        productId: 'PROD-002',
        productName: 'Test Product 2',
        selling_price: 320.00,
        mrp: 400.00,
        mrp_gst_amount: 72.00,
        gst_percentage: 18,
        gst_amount: 57.60,
        product_total: 377.60,
        totalPrice: 377.60
      }
    ]
  },
  slaData: {
    name: 'Test SLA',
    description: 'Test SLA for testing',
    packingTime: 24,
    shippingTime: 48,
    deliveryTime: 72
  }
};

// Create shell script for quick testing
const shellScript = `#!/bin/bash

# Order Audit Testing Script
echo "🧪 Order Audit Testing Environment"

# Load environment variables
if [ -f .env ]; then
    export \$(cat .env | grep -v '^#' | xargs)
fi

# Generate JWT token
generate_token() {
    local role="\$1"
    local user_id=""
    local user_name=""
    local user_email=""
    
    case "\$role" in
        "super")
            user_id="507f1f77bcf86cd799439011"
            user_name="Super Admin"
            user_email="superadmin@test.com"
            ;;
        "fulfillment")
            user_id="507f1f77bcf86cd799439012"
            user_name="Fulfillment Admin"
            user_email="fulfillment@test.com"
            ;;
        "inventory")
            user_id="507f1f77bcf86cd799439013"
            user_name="Inventory Admin"
            user_email="inventory@test.com"
            ;;
        "dealer")
            user_id="507f1f77bcf86cd799439014"
            user_name="Dealer User"
            user_email="dealer@test.com"
            ;;
        *)
            echo "Invalid role. Use: super, fulfillment, inventory, dealer"
            return 1
            ;;
    esac
    
    node -e "
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({
        id: '\$user_id',
        role: '\$role',
        name: '\$user_name',
        email: '\$user_email'
    }, process.env.JWT_SECRET || '$testConfig.jwtSecret', { expiresIn: '1h' });
    console.log(token);
    "
}

# Test order creation
test_create_order() {
    local token="\$1"
    echo "Creating test order..."
    curl -X POST "\$ORDER_SERVICE_URL/api/orders/create" \\
        -H "Authorization: Bearer \$token" \\
        -H "Content-Type: application/json" \\
        -d @test-data.json
}

# Test get all orders
test_get_orders() {
    local token="\$1"
    echo "Getting all orders..."
    curl -X GET "\$ORDER_SERVICE_URL/api/orders/all" \\
        -H "Authorization: Bearer \$token" \\
        -H "Content-Type: application/json"
}

# Main menu
case "\$1" in
    "setup")
        echo "Setting up testing environment..."
        npm install
        echo "✅ Setup complete!"
        ;;
    "token")
        if [ -z "\$2" ]; then
            echo "Usage: \$0 token <role>"
            echo "Roles: super, fulfillment, inventory, dealer"
            exit 1
        fi
        generate_token "\$2"
        ;;
    "create")
        if [ -z "\$2" ]; then
            echo "Usage: \$0 create <role>"
            exit 1
        fi
        token=\$(generate_token "\$2")
        test_create_order "\$token"
        ;;
    "list")
        if [ -z "\$2" ]; then
            echo "Usage: \$0 list <role>"
            exit 1
        fi
        token=\$(generate_token "\$2")
        test_get_orders "\$token"
        ;;
    "test")
        echo "Running automated tests..."
        node test-order-audit-endpoints.js
        ;;
    *)
        echo "Usage: \$0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  setup                    - Install dependencies"
        echo "  token <role>             - Generate JWT token for role"
        echo "  create <role>            - Create test order with role"
        echo "  list <role>              - List orders with role"
        echo "  test                     - Run automated tests"
        echo ""
        echo "Roles: super, fulfillment, inventory, dealer"
        ;;
esac
`;

// Write files
try {
  // Create .env file
  fs.writeFileSync('.env', envContent);
  console.log('✅ Created .env file');

  // Create package.json
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Created package.json');

  // Create test data file
  fs.writeFileSync('test-data.json', JSON.stringify(testData, null, 2));
  console.log('✅ Created test-data.json');

  // Create shell script
  fs.writeFileSync('test-orders.sh', shellScript);
  fs.chmodSync('test-orders.sh', '755');
  console.log('✅ Created test-orders.sh');

  // Create README for testing
  const readmeContent = `# Order Audit Testing Environment

This directory contains everything needed to test the order audit logging system.

## Quick Start

1. **Setup Environment**
   \`\`\`bash
   ./test-orders.sh setup
   \`\`\`

2. **Generate JWT Token**
   \`\`\`bash
   ./test-orders.sh token super
   \`\`\`

3. **Create Test Order**
   \`\`\`bash
   ./test-orders.sh create super
   \`\`\`

4. **List Orders**
   \`\`\`bash
   ./test-orders.sh list super
   \`\`\`

5. **Run Automated Tests**
   \`\`\`bash
   ./test-orders.sh test
   \`\`\`

## Manual Testing

### Using curl commands
See \`order-audit-test-commands.md\` for detailed curl commands.

### Using Node.js script
\`\`\`bash
node test-order-audit-endpoints.js
\`\`\`

## Configuration

Edit \`.env\` file to configure:
- ORDER_SERVICE_URL: Your order service URL
- JWT_SECRET: Your JWT secret key

## Test Users

- **Super-admin**: Full access to all endpoints
- **Fulfillment-Admin**: Access to fulfillment-related endpoints
- **Inventory-Admin**: Access to inventory-related endpoints
- **Dealer**: Access to dealer-specific endpoints

## Files

- \`test-order-audit-endpoints.js\`: Automated test script
- \`test-order-logging-system.js\`: Manual logging test script
- \`order-audit-test-commands.md\`: Curl commands for manual testing
- \`test-data.json\`: Test data for orders and SLAs
- \`test-orders.sh\`: Shell script for quick testing
- \`.env\`: Environment configuration
- \`package.json\`: Node.js dependencies

## Expected Results

All tests should:
1. ✅ Return appropriate HTTP status codes
2. ✅ Include proper authentication validation
3. ✅ Log activities in the audit system
4. ✅ Return meaningful response data
5. ✅ Handle errors gracefully
`;

  fs.writeFileSync('TESTING_README.md', readmeContent);
  console.log('✅ Created TESTING_README.md');

  console.log('\n🎉 Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: ./test-orders.sh setup');
  console.log('2. Run: ./test-orders.sh token super');
  console.log('3. Run: ./test-orders.sh test');
  console.log('\n📖 See TESTING_README.md for detailed instructions');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
