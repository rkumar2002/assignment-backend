const express = require('express');
const Log = require('../models/CommunicationsLog');
const router = express.Router();

// Get all communication logs
router.get('/logs', async (req, res) => {
    try{
        const logs = await Log.find();

        const response = logs.map (log => ({
                campaignId : log.campaignId,
                customerId : log.customerId,
                message : log.message,
                status : log.deliveryStatus,
                sentAt : log.createdAt,
            })
        )

        res.status(200).json(response);
    } catch (err){
        res.status(500).json({"An error occured while retreiving logs" : err});
        console.log("Error retrieving logs : ", err);
    }

})

module.exports = router;