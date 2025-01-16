const express = require('express');
const { getProblems, getProblem, createProblem } = require('../controllers/problems');

const router = express.Router();

router.get('/', getProblems); // Get all problems
router.get('/:id', getProblem); // Get problem by ID

// Route to create a new problem
router.post('/create', createProblem);

module.exports = router;
