const cron = require('node-cron');
const axios = require('axios'); // For microservice communication
const Ticket = require('../models/tickets');

// Microservice configuration
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:5001';
const MAX_TICKETS_PER_AGENT = 20;
// Cron job runs every minute
cron.schedule('* * * * *', async () => {
    console.log('[CRON] Running ticket assignment job at', new Date());

    try {
        // 1. Fetch all unassigned open tickets
        const unassignedTickets = await Ticket.find({
            assigned: false,
        }).limit(100); // Process max 100 tickets per run

        if (unassignedTickets.length === 0) {
            console.log('[CRON] No unassigned tickets found');
            return;
        }

        // 2. Fetch eligible support agents from User microservice
        const userData = await axios.get(`${USER_SERVICE_URL}/api/users/allUsers/internal`);
        const userList = userData.data.data;
        let agents = userList.filter(user => user.role === 'Customer-Support');
        agents = agents
            .filter(agent => (agent.ticketsAssigned?.length || 0) < MAX_TICKETS_PER_AGENT)
            .sort((a, b) => (a.ticketsAssigned?.length || 0) - (b.ticketsAssigned?.length || 0));

        if (!agents || agents.length === 0) {
            console.warn('[CRON] No available support agents');
            return;
        }

        // 3. Assign tickets using round-robin distribution
        const assignmentResults = {
            totalTickets: unassignedTickets.length,
            assigned: 0,
            failed: 0
        };

        let agentIndex = 0;

        for (const ticket of unassignedTickets) {
            try {
                agents = agents
                    .filter(agent => (agent.ticketsAssigned?.length || 0) < MAX_TICKETS_PER_AGENT)
                    .sort((a, b) => (a.ticketsAssigned?.length || 0) - (b.ticketsAssigned?.length || 0));
                const availableAgent = agents[0];

                // Update ticket
                await Ticket.findByIdAndUpdate(ticket._id, {
                    assigned_to: availableAgent._id,
                    assigned: true,
                    status: 'In Progress'
                });

                // Update user's assigned tickets count via microservice
                await axios.put(`${USER_SERVICE_URL}/api/users/assign-support/${ticket._id}/${availableAgent._id}`,);

                assignmentResults.assigned++;
                agentIndex++; // Move to next agent
            } catch (err) {
                console.error(`[CRON] Failed to assign ticket ${ticket._id}:`, err.message);
                assignmentResults.failed++;
            }
        }

        console.log('[CRON] Assignment results:', assignmentResults);
    } catch (err) {
        console.error('[CRON] Job failed:', err.message);
    }
});
module.exports = cron;