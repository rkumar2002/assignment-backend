const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    order_total: { type: Number, required: true },
    order_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);