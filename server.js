const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const customerRoutes = require('./routes/customer');
const orderRoutes = require('./routes/order');
const audienceRoutes = require('./routes/audience');
const campaignRoutes = require('./routes/campaign');
const deliveryReceipt = require('./routes/deliveryReceipt');
const communicationLogs = require('./routes/communicationLogs');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Base route
app.get('/', (req, res) => {
    res.send('CRM App Backend Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


app.use('/api', customerRoutes); 
app.use('/api', orderRoutes);
app.use('/api', audienceRoutes);
app.use('/api', campaignRoutes);
app.use('/api', deliveryReceipt);
app.use('/api', communicationLogs);
app.use('/api', authRoutes);