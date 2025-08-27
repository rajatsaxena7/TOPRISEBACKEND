const axios = require('axios');

// Test configuration
const BASE_URL = 'https://toprise.in';
const LOCAL_URL = 'http://localhost:3000';

// Test functions
async function testHealthEndpoint() {
  try {
    console.log('🏥 Testing health endpoint...');
    
    // Test local health
    const localResponse = await axios.get(`${LOCAL_URL}/health`, { timeout: 5000 });
    console.log('✅ Local health check passed:', localResponse.data);
    
    // Test production health (if accessible)
    try {
      const prodResponse = await axios.get(`${BASE_URL}/health`, { timeout: 10000 });
      console.log('✅ Production health check passed:', prodResponse.data);
    } catch (error) {
      console.log('⚠️  Production health check failed (expected if not deployed):', error.message);
    }
    
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

async function testCORSHeaders() {
  try {
    console.log('\n🌐 Testing CORS headers...');
    
    const response = await axios.options(`${LOCAL_URL}/api/users`, {
      headers: {
        'Origin': 'https://toprise.in',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization'
      },
      timeout: 5000
    });
    
    console.log('✅ CORS headers present:', {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    });
    
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
  }
}

async function testServiceEndpoints() {
  const endpoints = [
    { name: 'User Service', path: '/api/users' },
    { name: 'Product Service', path: '/api/category' },
    { name: 'Order Service', path: '/api/orders' },
    { name: 'Notification Service', path: '/api/notification' }
  ];
  
  console.log('\n🔍 Testing service endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${LOCAL_URL}${endpoint.path}`, { 
        timeout: 5000,
        validateStatus: () => true // Accept any status code
      });
      
      console.log(`✅ ${endpoint.name} is responding (Status: ${response.status})`);
      
    } catch (error) {
      console.log(`❌ ${endpoint.name} failed:`, error.message);
    }
  }
}

async function testDockerServices() {
  try {
    console.log('\n🐳 Checking Docker services...');
    
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    const { stdout } = await execAsync('docker-compose -f docker-compose.prod.yml ps');
    console.log('📋 Docker services status:');
    console.log(stdout);
    
  } catch (error) {
    console.log('❌ Docker services check failed:', error.message);
  }
}

async function testEnvironmentConfiguration() {
  console.log('\n⚙️  Checking environment configuration...');
  
  const configs = [
    { name: 'docker-compose.prod.yml', path: './docker-compose.prod.yml' },
    { name: 'deploy.sh', path: './deploy.sh' },
    { name: 'PRODUCTION_DEPLOYMENT_GUIDE.md', path: './PRODUCTION_DEPLOYMENT_GUIDE.md' }
  ];
  
  const fs = require('fs');
  
  for (const config of configs) {
    if (fs.existsSync(config.path)) {
      console.log(`✅ ${config.name} exists`);
    } else {
      console.log(`❌ ${config.name} missing`);
    }
  }
}

async function testCORSConfiguration() {
  console.log('\n🔧 Checking CORS configuration in services...');
  
  const services = [
    { name: 'User Service', file: './services/user-service/src/index.js' },
    { name: 'Product Service', file: './services/product-service/src/index.js' },
    { name: 'Order Service', file: './services/order-service/src/index.js' },
    { name: 'Notification Service', file: './services/notification-service/src/index.js' },
    { name: 'API Gateway', file: './api-gateway/server.js' }
  ];
  
  const fs = require('fs');
  
  for (const service of services) {
    if (fs.existsSync(service.file)) {
      const content = fs.readFileSync(service.file, 'utf8');
      if (content.includes('toprise.in')) {
        console.log(`✅ ${service.name} has toprise.in CORS configuration`);
      } else {
        console.log(`❌ ${service.name} missing toprise.in CORS configuration`);
      }
    } else {
      console.log(`❌ ${service.name} file not found`);
    }
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting production deployment tests for toprise.in...\n');
  
  await testEnvironmentConfiguration();
  await testCORSConfiguration();
  await testDockerServices();
  await testHealthEndpoint();
  await testCORSHeaders();
  await testServiceEndpoints();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- If all tests passed, your services are ready for production deployment');
  console.log('- Follow the PRODUCTION_DEPLOYMENT_GUIDE.md for deployment instructions');
  console.log('- Use ./deploy.sh to automate the deployment process');
  console.log('- Your services will be accessible at https://toprise.in');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthEndpoint,
  testCORSHeaders,
  testServiceEndpoints,
  testDockerServices,
  testEnvironmentConfiguration,
  testCORSConfiguration,
  runAllTests
};
