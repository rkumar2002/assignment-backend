const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommunicationsLogSchema = new Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  audienceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Audience', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  message: { type: String, required: true },
  deliveryStatus: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CommunicationsLog', CommunicationsLogSchema);
