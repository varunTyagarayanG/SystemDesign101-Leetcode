const fs = require('fs').promises;
const path = require('path');
const Docker = require('dockerode');
const docker = new Docker();
const Submission = require("../models/Submission"); // Assuming a Submission model exists

// Language configuration for supported languages
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

// Function to execute code using Docker
const executeCode = async (code, language) => {
    if (!languageConfig[language]) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const { image, extension, command } = languageConfig[language];
    const tempFilePath = path.join(__dirname, 'temp', `temp_code.${extension}`);

    try {
        // Ensure the temp directory exists
        await fs.mkdir(path.dirname(tempFilePath), { recursive: true });

        // Write the code to a temporary file
        await fs.writeFile(tempFilePath, code);

        // Create a Docker container to execute the code
        const container = await docker.createContainer({
            Image: image,
            Tty: false,
            Cmd: command, // Command to execute the file
            HostConfig: {
                Binds: [`${path.dirname(tempFilePath)}:/code`], // Mount the temp directory
            },
        });

        console.log(`Starting Docker container for ${language}...`);

        // Start the container
        await container.start();

        // Wait for the container to finish execution
        await container.wait();

        // Collect the logs from the container
        const logs = await container.logs({
            stdout: true,
            stderr: true,
        });

        // Remove the container after execution
        await container.remove();

        // Clean up the temp file
        await fs.unlink(tempFilePath);

        // Convert logs from Buffer to string and return
        const output = logs.toString("utf-8").trim();
        return { output };
    } catch (error) {
        console.error("Error executing code:", error);

        // Clean up in case of failure
        await fs.unlink(tempFilePath).catch(() => null);
        throw new Error("Code execution failed");
    }
};

// // Controller to handle code submission
// exports.submitSolution = async (req, res) => {
//     try {
//         const { code, language } = req.body;

//         if (!code || !language) {
//             return res.status(400).json({ message: 'Code and language are required' });
//         }

//         if (!languageConfig[language]) {
//             return res.status(400).json({ message: `Unsupported language: ${language}` });
//         }

//         // Execute the code
//         const executionResult = await executeCode(code, language);

//         if (!executionResult) {
//             return res.status(400).json({ message: 'Error executing code' });
//         }

//         // Clean the output by removing non-printable characters and trimming whitespace
//         const cleanedOutput = executionResult.output
//             .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
//             .trim(); // Trim leading and trailing spaces

//         console.log("Cleaned Output:", cleanedOutput);

//         const testCaseResults = "passed"; // Example test case result

//         // Save the submission to the database
//         const submission = await Submission.create({
//             problemId: req.params.id,
//             code,
//             language,
//             testCaseResults, // Modify based on actual test case evaluation
//         });

//         return res.status(201).json({
//             message: 'Submission received',
//             submissionId: submission._id,
//             executionResult: cleanedOutput, // Return the cleaned output
//         });
//     } catch (err) {
//         console.error("Error submitting solution:", err);
//         return res.status(500).json({ message: 'Error submitting solution', error: err.message });
//     }
// };


exports.executeCode = executeCode;