const express = require('express');
const { getProblems, getProblem, createProblem } = require('../controllers/problems');

const router = express.Router();

router.get('/', getProblems); 
router.get('/:id', getProblem); 
router.post('/create', createProblem);

module.exports = router;
