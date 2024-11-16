const express = require('express');
const router = express.Router();
const axios = require('axios');
const Campaign = require('../models/Campaign');  // Assuming you have a Campaign model
const CommunicationsLog = require('../models/CommunicationsLog'); // Assuming you have a CommunicationsLog model
require('dotenv').config();

// POST route to handle campaign creation and message sending
router.post('/campaign', async (req, res) => {
  const { campaignName, message, audienceId, customers, size } = req.body;

  try {
    // Step 1: Create a new campaign record
    const newCampaign = new Campaign({
      name: campaignName,
      message,
      audienceId,
      size
    });
    const savedCampaign = await newCampaign.save();

    // Step 2: Iterate over customers and send messages
    for (const customer of customers) {
      const personalizedMessage = message.replace('[Name]', customer.name);  // Personalize message
      
      // Step 3: Log communication details in the CommunicationsLog table with initial status as "PENDING"
      const communicationLog = new CommunicationsLog({
        campaignId: savedCampaign._id,
        audienceId,
        customerId: customer._id,  // Assuming customer has an _id field
        customerName: customer.name,
        customerEmail: customer.email,
        message: personalizedMessage,
        deliveryStatus: 'PENDING'  // Initial status before delivery
      });

      const savedLog = await communicationLog.save();

      // Step 4: Call the Delivery Receipt API to update delivery status
      await axios.post(`${process.env.BACKEND_BASE_URL}/delivery-receipt`, {
        communicationLogId: savedLog._id,
        campaignId : savedLog.campaignId
      });
    }

    // Step 5: Send response back
    res.status(200).json({
      message: 'Campaign created and messages are being processed!',
      campaignId: savedCampaign._id
    });
  } catch (error) {
    console.error('Error creating campaign or sending messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/campaign', async (req, res) => {
    try {
      // Fetch campaigns sorted by createdAt (most recent first)
      const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })  // Sort by createdAt in descending order
      .select('name size messagesSent createdAt audienceId')  // Select only the necessary fields
      .populate('audienceId', 'name');  // Populate the 'audienceId' field and only return the 'name' field from Audience model

    // Format the campaign data and add a "failed" field (size - messagesSent)
    const formattedCampaigns = campaigns.map(campaign => ({
      name: campaign.name,
      size: campaign.size,
      messagesSent: campaign.messagesSent,
      failed: campaign.size - campaign.messagesSent,  // Calculate failed as size - messagesSent
      createdAt: campaign.createdAt,
      audienceName: campaign.audienceId.name 
    }));
  
      res.status(200).json(formattedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });


module.exports = router;
