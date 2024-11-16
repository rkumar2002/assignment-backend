const express = require('express');
const router = express.Router();
const { publishToQueue } = require('../publisher');
const Campaign = require('../models/Campaign');

// POST route to handle delivery receipt
router.post('/delivery-receipt', async (req, res) => {
  const { communicationLogId, campaignId } = req.body;

  try {
    // Randomly determine status with 60% chance for SENT and 40% for FAILED
    const randomStatus = Math.random() < 0.60 ? 'SENT' : 'FAILED';


    // Step 1: Prepare the message to publish to the queue
    const message = {
      communicationLogId,
      deliveryStatus: randomStatus,
      campaignId
    };

    // Step 2: Publish the message to RabbitMQ queue
    await publishToQueue('deliveryReceiptQueue', message);

    // Step 3: Send response back
    res.status(200).json({
      message: 'Delivery status sent to queue successfully',
      status: randomStatus
    });
  } catch (error) {
    console.error('Error sending delivery status to queue:', error);
    res.status(500).json({ message: 'Failed to send delivery status' });
  }
});

module.exports = router;