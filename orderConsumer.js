const amqp = require('amqplib');
const Order = require('./models/Order');
const Customer = require('./models/Customer');
const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB connected in orderConsumer');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};


// Function to consume messages from RabbitMQ
async function consumeQueue(queueName) {
    try {
        // Connection to RabbitMQ
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();

        // Ensure the queue exists
        await channel.assertQueue(queueName, { durable: true });

        // Consume messages from the queue
        channel.consume(queueName, async (msg) => {
            const orderData = JSON.parse(msg.content.toString());
            console.log('Received order data:', orderData);

            const { customer_id, order_total } = orderData;

            try {
                // Find the customer
                const customer = await Customer.findById(customer_id);
                if (!customer) {
                    console.error('Customer not found:', customer_id);
                    channel.ack(msg);  // Acknowledge message to remove it from the queue
                    return;
                }

                // Create a new order
                const newOrder = new Order({ customer_id, order_total });
                await newOrder.save();

                // Update customer's total_spent and visits
                customer.total_spent += order_total;
                customer.visits += 1;
                customer.last_visit_date = Date.now();
                await customer.save();

                console.log('Order processed and customer updated');
            } catch (error) {
                console.error('Error processing order:', error);
            }

            // Acknowledge the message to remove it from the queue
            channel.ack(msg);
        });

        console.log(`Waiting for messages in ${queueName}...`);
    } catch (error) {
        console.error('Error in consuming queue:', error);
    }
}

// First connect to MongoDB, then start consuming the queue
connectDB().then(() => {
    consumeQueue('orderQueue');
});