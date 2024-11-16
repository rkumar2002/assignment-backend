const express = require('express');
const { publishToQueue } = require('../publisher');  // Import publisher function
const router = express.Router();

// Add a new customer
router.post('/customers', async (req, res) => {
    const { name, email, total_spent, visits, last_visit_date } = req.body;  // Collect customer details from the body

    try {
        // Validate the incoming data
        if (!name || !email) {
            return res.status(400).json({ message: 'Missing required customer data' });
        }

        // Prepare customer data for publishing
        const customerData = { name, email, total_spent, visits, last_visit_date };

        // Publish the validated data to RabbitMQ's customerQueue
        await publishToQueue('customerQueue', customerData);

        // Respond to the client that data has been published for processing
        res.status(200).json({ message: 'Customer data sent for processing' });
    } catch (error) {
        console.error('Error in processing customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;