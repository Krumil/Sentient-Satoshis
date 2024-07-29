import express from 'express';
import { startAutonomousAgent } from "./agentGenerator.js";

const app = express();
const port = 3000;

app.get('/start-agent', async (req, res) => {
	console.log("Starting a new trading cycle...");
	try {
		await startAutonomousAgent(res);
	} catch (error) {
		console.error("Error during trading cycle:", error);
		res.status(500).json({ error: "An error occurred during the trading cycle" });
	}
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});