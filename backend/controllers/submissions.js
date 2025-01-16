const Submission = require('../models/Submission');
const { executeCode } = require('./codeExecution');

exports.submitSolution = async (req, res) => {
    try {
        const { code } = req.body;

        // Call executeCode method
        const executionResult = await executeCode(code);
        if (!executionResult) {
            return res.status(400).json({ message: 'Error executing code' }); // Handle error gracefully
        }

        // Clean the output by removing non-printable characters and trimming whitespace
        const cleanedOutput = executionResult.output
            .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
            .trim(); // Trim leading and trailing spaces

        console.log("Cleaned Output:", cleanedOutput);

        const str = "passed";

        // Save the submission to the database
        const submission = await Submission.create({
            problemId: req.params.id,
            code,
            testCaseResults: str, // Update this if needed to reflect test case results
        });

        return res.status(201).json({
            message: 'Submission received',
            submissionId: submission._id,
            executionResult: cleanedOutput, // Return the cleaned output
        });
    } catch (err) {
        return res.status(500).json({ message: 'Error submitting solution', error: err.message });
    }
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
