const Submission = require('../models/Submission');
const { executeCode } = require('./codeExecution');

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

exports.getSubmissionStatus = async (req, res) => {
    try {
        // Fetch all submissions with the given problemId
        const submissions = await Submission.find({ problemId: req.params.problemId });
        if (!submissions || submissions.length === 0) {
            return res.status(404).json({ message: 'No submissions found for the given problemId' });
        }
        res.status(200).json(submissions); // Return all matching submissions
    } catch (err) {
        res.status(500).json({ message: 'Error fetching submissions', error: err.message });
    }
};
exports.submitSolution = async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({ message: 'Code and language are required' });
        }

        if (!languageConfig[language]) {
            return res.status(400).json({ message: `Unsupported language: ${language}` });
        }

        // Execute the code
        const executionResult = await executeCode(code, language);

        if (!executionResult) {
            return res.status(400).json({ message: 'Error executing code' });
        }

        // Clean the output by removing non-printable characters and trimming whitespace
        const cleanedOutput = executionResult.output
            .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
            .trim(); // Trim leading and trailing spaces

        console.log("Cleaned Output:", cleanedOutput);

        const testCaseResults = "passed"; // Example test case result

        // Save the submission to the database
        const submission = await Submission.create({
            problemId: req.params.id,
            code,
            language,
            testCaseResults, // Modify based on actual test case evaluation
        });

        return res.status(201).json({
            message: 'Submission received',
            submissionId: submission._id,
            executionResult: cleanedOutput, // Return the cleaned output
        });
    } catch (err) {
        console.error("Error submitting solution:", err);
        return res.status(500).json({ message: 'Error submitting solution', error: err.message });
    }
};