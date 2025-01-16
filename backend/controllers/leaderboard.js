const redis = require("redis");

// Create Redis client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redisClient.on("error", (err) => {
    console.error("Redis connection error:", err);
});

// Connect to Redis
redisClient.connect();

/**
 * Add a score to the leaderboard
 */
exports.addScore = async (req, res) => {
    const { userId, score } = req.body;

    if (!userId || typeof score !== "number") {
        return res.status(400).json({ error: "Invalid input" });
    }

    try {
        // Add or update score in Redis (sorted set)
        await redisClient.zAdd("leaderboard", [
            { score, value: userId },
        ]);

        res.status(200).json({ message: "Score added successfully" });
    } catch (err) {
        console.error("Error adding score:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get top N scorers
 */
exports.getTopScorers = async (req, res) => {
    const { limit } = req.query;

    try {
        // Fetch top N users from the leaderboard
        const topScorers = await redisClient.zRangeWithScores(
            "leaderboard",
            0,
            limit ? parseInt(limit) - 1 : 9, // Default limit is 10
            { REV: true }
        );

        res.status(200).json({ topScorers });
    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get a user's rank and score
 */
exports.getUserRank = async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch the user's rank
        const rank = await redisClient.zRevRank("leaderboard", userId);

        if (rank === null) {
            return res.status(404).json({ error: "User not found in leaderboard" });
        }

        // Fetch the user's score
        const score = await redisClient.zScore("leaderboard", userId);

        res.status(200).json({ rank: rank + 1, score });
    } catch (err) {
        console.error("Error fetching user rank:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
