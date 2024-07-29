import { app } from "./graph/graph.js"
import path from "path";
import fs from "fs/promises";
import { Response } from 'express';



async function readPromptFromFile(filename: string): Promise<string> {
	const filePath = path.join(process.cwd(), filename);
	try {
		return await fs.readFile(filePath, "utf-8");
	} catch (error) {
		console.error(`Error reading prompt file: ${error}`);
		throw error;
	}
}

async function createDefaultPrompt(): Promise<string> {
	const tradingPrompt = await readPromptFromFile(
		"prompts/trading_agent_prompt.txt"
	);
	const defaultPrompt = await readPromptFromFile("prompts/default_prompt.txt");

	return `${defaultPrompt}\n\n${tradingPrompt}\n\n`;
}

async function startAutonomousAgent(res: Response) {
	console.log("Starting autonomous agent...");
	const config = { recursionLimit: 50, configurable: { thread_id: "agent" } };
	const defaultPrompt = await createDefaultPrompt();
	const inputs = {
		input: defaultPrompt + " Start trading"
	};

	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
	});

	try {
		for await (const event of await app.stream(inputs, config)) {
			res.write(`data: ${JSON.stringify(event)}\n\n`);
		}
	} catch (error) {
		console.error("Error in autonomous agent execution:", error);
		res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
	} finally {
		res.end();
	}
}

export { startAutonomousAgent };