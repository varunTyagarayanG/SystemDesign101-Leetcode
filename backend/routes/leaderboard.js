const express = require("express");
const {
    addScore,
    getTopScorers,
    getUserRank,
} = require("../controllers/leaderboard");

const router = express.Router();

router.post("/leaderboard/add", addScore);
router.get("/leaderboard/top", getTopScorers);
router.get("/leaderboard/rank/:userId", getUserRank);

module.exports = router;
