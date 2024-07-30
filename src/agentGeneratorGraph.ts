import fs from "fs/promises";
import path from "path";
import { Response } from 'express';
import { app } from "./graph/graph.js"
import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";

async function readPromptFromFile(filename: string): Promise<string> {
	const filePath = path.join(process.cwd(), filename);
	try {
		return await fs.readFile(filePath, "utf-8");
	} catch (error) {
		console.error(`Error reading prompt file: ${error}`);
		throw error;
	}
}

async function createTradingPrompt(): Promise<string> {
	const tradingPrompt = await readPromptFromFile(
		"prompts/trading_agent_prompt.txt"
	);
	return tradingPrompt;
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
	const config = {
		recursionLimit: 50, configurable: { thread_id: "agent" },
	};
	const defaultPrompt = await createDefaultPrompt();
	const inputs = {
		input: defaultPrompt + " Start trading"
	};
	const thinkingModel = new ChatAnthropic({
		clientOptions: {
			defaultHeaders: {
				"X-Api-Key": process.env.ANTHROPIC_API_KEY,
			},
		},
		modelName: "claude-3-haiku-20240307",
		temperature: 0,
		streaming: false,
	});
	const tradingPrompt = await createTradingPrompt();
	const thinkingPromptTemplate = PromptTemplate.fromTemplate(
		tradingPrompt + "\n\nExplain this part of your reasoning in a language that is appropriate for your personality like it's an internal monologue. Be concise. {thought}"
	);

	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'Content-Encoding': 'none',
		'Access-Control-Allow-Origin': '*'
	});

	try {
		for await (const event of await app.stream(inputs, config)) {
			const chain = thinkingPromptTemplate.pipe(thinkingModel);
			const result = await chain.invoke({ thought: JSON.stringify(event) });
			res.write(`data: ${result.content}\n\n`);
		}
		console.log("Stream completed");
	} catch (error) {
		console.error("Error in autonomous agent execution:", error);
		res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
	} finally {
		console.log("Ending response");
		res.end();
	}
}

export { startAutonomousAgent };