const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  audienceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Audience', required: true },
  size: { type: Number, required: true },
  messagesSent : { type : Number, default : 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Campaign', CampaignSchema);