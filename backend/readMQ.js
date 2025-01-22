const amqp = require('amqplib/callback_api');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { executeCode } = require('./controllers/codeExecution'); // Adjust path
const Submission = require('./models/Submission'); // Adjust path

dotenv.config();

const processCodeSubmission = async (submission, channel, msg) => {
    try {
        console.log("Processing submission:", submission);

        // Check if problemId exists
        if (!submission.problemId) {
            throw new Error("Missing required field: problemId");
        }

        // Execute the code
        const executionResult = await executeCode(submission.code, submission.language , submission.problemId);
        console.log("Execution Result:", executionResult.output);
        console.log(executionResult.fullCode)
        // Save the result to the database
        const submissionRecord = await Submission.create({
            problemId: submission.problemId,
            code: submission.code,
            executionResult: executionResult.output,
        });

        // Ensure the data is saved before acknowledging the message
        if (submissionRecord) {
            console.log("Submission saved:", submissionRecord._id);
            // Acknowledge the message after the database save
            channel.ack(msg);
        } else {
            throw new Error("Failed to save submission to the database");
        }

    } catch (error) {
        console.error("Error during processing:", error.message || error);
        // Optionally: Retry message after some time or dead-letter queue logic
        channel.nack(msg, false, true); // Requeue the message for retry
    }
};

// RabbitMQ Consumer
const startConsumer = () => {
    amqp.connect('amqp://localhost', (error0, connection) => {
        if (error0) {
            console.error("Failed to connect to RabbitMQ:", error0.message);
            return;
        }
        console.log("Connected to RabbitMQ");

        connection.createChannel((error1, channel) => {
            if (error1) {
                console.error("Failed to create channel:", error1.message);
                return;
            }
            console.log("Channel created");

            const queue = 'code_queue';
            channel.assertQueue(queue, { durable: true });
            console.log(`Waiting for messages in ${queue}. To exit press CTRL+C`);

            channel.consume(queue, async (msg) => {
                if (msg) {
                    console.log("Message received:", msg.content.toString());
                    const submission = JSON.parse(msg.content.toString());

                    // Ensure problemId is passed correctly from the message
                    if (!submission.problemId) {
                        console.error("Error: problemId is missing in the message");
                        // Reject the message and don't requeue it if problemId is missing
                        channel.nack(msg, false, false);
                        return;
                    }

                    // Process the submission and check database before acknowledgment
                    try {
                        await processCodeSubmission(submission, channel, msg);
                    } catch (err) {
                        console.error("Failed to process submission:", err.message || err);
                        // Optionally: Retry message after some time or dead-letter queue logic
                        channel.nack(msg, false, true); // Requeue the message for retry
                    }
                }
            });
        });
    });
};


// Start the database connection and RabbitMQ consumer
(async () => {
    await mongoose
        .connect("mongodb://0.0.0.0:27017/leetcode")
        .then(() => {
            console.log('Connected to MongoDB');
        })
        .catch((err) => console.error(err));

    startConsumer();
})();
