const amqp = require('amqplib/callback_api');
const { executeCode } = require('../controllers/codeExecution'); // Adjust path
const Submission = require('../models/Submission'); // Adjust path

const languageConfig = {
    python: {
        image: "python:3.9-slim",
        extension: "py",
        command: ["python", "/code/temp_code.py"],
    },
    javascript: {
        image: "node:16",
        extension: "js",
        command: ["node", "/code/temp_code.js"],
    },
    java: {
        image: "openjdk:17-slim",
        extension: "java",
        command: ["bash", "-c", "javac /code/temp_code.java && java -cp /code temp_code"],
    },
    c: {
        image: "gcc:latest",
        extension: "c",
        command: ["bash", "-c", "gcc /code/temp_code.c -o /code/temp_code && /code/temp_code"],
    },
    cpp: {
        image: "gcc:latest",
        extension: "cpp",
        command: ["bash", "-c", "g++ /code/temp_code.cpp -o /code/temp_code && /code/temp_code"],
    },
};

// The route to submit the solution
exports.submitSolution = async (req, res) => {
    try {
        const { code, language } = req.body;
        const problemId  = req.params.id; // Get problemId from the route
        console.log("Problem ID:", problemId);
        if (!code || !language) {
            return res.status(400).json({ message: 'Code and language are required' });
        }

        if (!languageConfig[language]) {
            return res.status(400).json({ message: `Unsupported language: ${language}` });
        }

        // Publish the code and language to the RabbitMQ queue along with problemId
        amqp.connect('amqp://localhost', (error, connection) => {
            if (error) {
                return res.status(500).json({ message: 'Error connecting to RabbitMQ', error: error.message });
            }
            connection.createChannel((err, channel) => {
                if (err) {
                    return res.status(500).json({ message: 'Error creating RabbitMQ channel', error: err.message });
                }

                const queue = 'code_queue';
                channel.assertQueue(queue, { durable: true });

                // Create a unique ID for this submission
                const submissionId = Date.now().toString();

                // Create the message object, including problemId
                const message = JSON.stringify({
                    submissionId,
                    code,
                    language,
                    problemId, // Include problemId in the message
                });
                console.log("Submission message:", message);
                // Send the message to the queue
                channel.sendToQueue(queue, Buffer.from(message), { persistent: false });

                // console.log(" [x] Sent to queue:", message);

                return res.status(201).json({
                    message: 'Submission received and queued for execution',
                    submissionId,
                });
            });
        });
    } catch (err) {
        console.error("Error submitting solution:", err);
        return res.status(500).json({ message: 'Error submitting solution', error: err.message });
    }
};
