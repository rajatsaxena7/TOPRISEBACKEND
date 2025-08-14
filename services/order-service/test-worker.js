const dealerAssignmentQueue = require("./src/queues/assignmentQueue");

async function testWorker() {
  try {
    console.log("🧪 Testing Dealer Assignment Worker...");
    
    // Add a test job to the queue
    const testJob = await dealerAssignmentQueue.add(
      { orderId: "test-order-123" },
      { 
        attempts: 3, 
        backoff: { type: "exponential", delay: 1000 }, 
        removeOnComplete: true, 
        removeOnFail: false 
      }
    );
    
    console.log(`✅ Test job added to queue with ID: ${testJob.id}`);
    console.log("📋 Check your logs to see if the worker processes this job");
    
    // Wait a bit to see the job process
    setTimeout(() => {
      console.log("⏰ Test completed. Check your application logs for worker activity.");
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error("❌ Error testing worker:", error.message);
    process.exit(1);
  }
}

testWorker();
