const amqp = require('amqplib');
const Customer = require('./models/Customer');
const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB connected in customerConsumer');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);  // Exit the process if unable to connect
    }
};


// Function to consume messages from RabbitMQ's customerQueue
async function consumeQueue(queueName) {
    try {
        // Connect to RabbitMQ
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();

        // Ensure the queue exists
        await channel.assertQueue(queueName, { durable: true });

        // Consume messages from the queue
        channel.consume(queueName, async (msg) => {
            const customerData = JSON.parse(msg.content.toString());
            console.log('Received customer data:', customerData);

            const { name, email, total_spent, visits, last_visit_date } = customerData;

            try {
                // Create a new customer and save to the database
                const newCustomer = new Customer({ name, email, total_spent, visits, last_visit_date });
                await newCustomer.save();

                console.log('Customer processed and saved:', newCustomer);
            } catch (error) {
                console.error('Error processing customer:', error);
            }

            // Acknowledge the message to remove it from the queue
            channel.ack(msg);
        });

        console.log(`Waiting for messages in ${queueName}...`);
    } catch (error) {
        console.error('Error in consuming queue:', error);
    }
}

// Start consuming from the customerQueue
connectDB().then(() => {
    consumeQueue('customerQueue');
});