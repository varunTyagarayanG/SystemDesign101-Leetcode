const redis = require("redis");

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redisClient.on("error", (err) => {
    console.error("Redis connection error:", err);
});

redisClient.connect();


exports.addScore = async (req, res) => {
    const { userId, score } = req.body;

    if (!userId || typeof score !== "number") {
        return res.status(400).json({ error: "Invalid input" });
    }

    try {
        await redisClient.zAdd("leaderboard", [
            { score, value: userId },
        ]);

        res.status(200).json({ message: "Score added successfully" });
    } catch (err) {
        console.error("Error adding score:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.getTopScorers = async (req, res) => {
    const { limit } = req.query;

    try {

        const topScorers = await redisClient.zRangeWithScores(
            "leaderboard",
            0,
            limit ? parseInt(limit) - 1 : 9, 
            { REV: true }
        );

        res.status(200).json({ topScorers });
    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.getUserRank = async (req, res) => {
    const { userId } = req.params;

    try {
        const rank = await redisClient.zRevRank("leaderboard", userId);

        if (rank === null) {
            return res.status(404).json({ error: "User not found in leaderboard" });
        }

        const score = await redisClient.zScore("leaderboard", userId);

        res.status(200).json({ rank: rank + 1, score });
    } catch (err) {
        console.error("Error fetching user rank:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
