const Problem = require('../models/Problem');

// Get all problems
exports.getProblems = async (req, res) => {
    try {
        const problems = await Problem.find();
        res.status(200).json(problems);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching problems', error: err.message });
    }
};

// Get a single problem by ID
exports.getProblem = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }
        res.status(200).json(problem);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching problem', error: err.message });
    }
};

// Create a new problem
exports.createProblem = async (req, res) => {
    try {
        const { title, description, codeStub, testCases, metadata } = req.body;

        // Ensure that difficulty is part of metadata and tags is optional
        const { difficulty, tags } = metadata || {};

        // Validate that all required fields are present
        if (!difficulty || !codeStub) {
            return res.status(400).json({ message: 'Missing required fields: difficulty and codeStub are required.' });
        }

        const problem = await Problem.create({
            title,
            description,
            codeStub,
            testCases,
            metadata: {
                difficulty,
                tags: tags || []
            }
        });

        res.status(201).json({ message: 'Problem created successfully', problem });
    } catch (err) {
        res.status(500).json({ message: 'Error creating problem', error: err.message });
    }
};

