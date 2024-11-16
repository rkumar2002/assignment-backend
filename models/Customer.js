const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    total_spent: { type: Number, default: 0 },
    visits: { type: Number, default: 0 },
    last_visit_date: { type: Date, default: null }
});

module.exports = mongoose.model('Customer', CustomerSchema);