const amqp = require('amqplib');
require('dotenv').config();

// Function to publish data to RabbitMQ
async function publishToQueue(queueName, message) {
  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Ensure the queue exists
    await channel.assertQueue(queueName, { durable: true });

    // Send the message to the queue
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log('Message sent:', message);

    // Close the connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error in publishing to queue:', error);
  }
}

module.exports = { publishToQueue };