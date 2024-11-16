const express = require('express');
const { publishToQueue } = require('../publisher');  // Import the publisher function
const Customer = require('../models/Customer');       // To validate customer ID
const router = express.Router();

// Add a new order
router.post('/orders', async (req, res) => {
    const { customer_id, order_total } = req.body;

    try {
        // Validate the incoming data
        if (!customer_id || !order_total) {
            return res.status(400).json({ message: 'Invalid order data' });
        }

        // Validate that the customer exists
        const customer = await Customer.findById(customer_id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Prepare order data for publishing
        const orderData = { customer_id, order_total };

        // Publish the validated data to RabbitMQ
        await publishToQueue('orderQueue', orderData);

        // Respond to the client with success message
        res.status(200).json({ message: 'Order data sent for processing' });
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
