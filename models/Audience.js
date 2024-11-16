const mongoose = require('mongoose');

const AudienceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    conditions: [{ // Array of conditions that define the segment
        field: String,    // e.g., 'total_spent'
        operator: String, // e.g., 'greater_than'
        value: Number,    // e.g., 10000
    }],
    size: { type: Number, default: 0 },  // Calculated audience size
    customers: [{    // Array to store customer details falling in the segment
        name: String,    // Customer's name
        email: String    // Customer's email
    }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Audience', AudienceSchema);
