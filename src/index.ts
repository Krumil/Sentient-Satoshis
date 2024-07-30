import express from 'express';
import { startAutonomousAgent, stopAutonomousAgent } from "./agentGeneratorReAct.js";
// import { startAutonomousAgent } from "./agentGeneratorGraph.js";

const app = express();
const port = 3001;

let agentRunning = false;


app.get('/start-agent', async (req, res) => {
	if (agentRunning) {
		res.status(400).json({ error: "Agent is already running" });
		return;
	}
	console.log("Starting a new trading cycle...");
	try {
		agentRunning = true;
		await startAutonomousAgent(res);
	} catch (error) {
		console.error("Error during trading cycle:", error);
		res.status(500).json({ error: "An error occurred during the trading cycle" });
	} finally {
		agentRunning = false;
	}
});

app.get('/stop-agent', (req, res) => {
	if (!agentRunning) {
		res.status(400).json({ error: "No agent is currently running" });
		return;
	}
	console.log("Stopping the trading agent...");
	stopAutonomousAgent();
	res.json({ message: "Agent stop signal sent" });
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});