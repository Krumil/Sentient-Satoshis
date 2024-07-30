import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { Response } from 'express';
import { brianTools } from "./tools/brianTools.js";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getNewsTool } from "./tools/newsTools.js";
import { getTradableTokensTool, getTokenBalancesTool } from "./tools/lifiTools.js";
import { tavilyTool } from "./tools/tavilyTools.js";
import { EventEmitter } from 'events';


import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const agentEmitter = new EventEmitter();

const tools = [
	...brianTools,
	tavilyTool,
	getTradableTokensTool,
	getTokenBalancesTool,
	getNewsTool,
];

const llm = new ChatAnthropic({
	clientOptions: {
		defaultHeaders: {
			"X-Api-Key": process.env.ANTHROPIC_API_KEY,
		},
	},
	// modelName: "claude-3-haiku-20240307",
	modelName: "claude-3-5-sonnet-20240620",
	temperature: 0,
	streaming: false,
});

async function readPromptFromFile(filename: string): Promise<string> {
	const filePath = path.join(process.cwd(), filename);
	try {
		return await fs.readFile(filePath, "utf-8");
	} catch (error) {
		console.error(`Error reading prompt file: ${error}`);
		throw error;
	}
}

async function createSystemMessage(): Promise<string> {
	const tradingPrompt = await readPromptFromFile(
		"prompts/trading_agent_prompt.txt"
	);

	const defaultPrompt = await readPromptFromFile("prompts/default_prompt.txt");

	let infoPrompt = await readPromptFromFile("prompts/info_prompt.txt");
	const today = new Date();
	const address = "0x2dc62eB610423588064bac52773D068962444fc2";
	infoPrompt = infoPrompt.replace("{{today}}", today.toISOString());
	infoPrompt = infoPrompt.replace("{{address}}", address);
	infoPrompt = infoPrompt.replace("{{ALCHEMY_API_KEY}}", process.env.ALCHEMY_API_KEY ?? '');

	return `${defaultPrompt}\n\n${tradingPrompt}\n\n${infoPrompt}`;
}

export async function startAutonomousAgent(res: Response): Promise<void> {
	console.log("Starting autonomous agent...");
	const systemMessage = await createSystemMessage();
	const memory = new MemorySaver();

	const app = createReactAgent({
		llm,
		tools,
		messageModifier: systemMessage,
		checkpointSaver: memory,
	});

	const config = {
		configurable: {
			thread_id: "agent-thread",
		},
		recursionLimit: 50,
	};

	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'Content-Encoding': 'none',
		'Access-Control-Allow-Origin': '*'
	});

	async function runAgentCycle() {
		try {
			for await (const event of await app.stream({
				messages: [new HumanMessage("Start Trading")]
			}, { ...config, streamMode: "updates" })) {
				try {
					if (agentEmitter.listenerCount('stop') > 0) {
						console.log("Stopping agent...");
						res.write(`data: Agent stopped\n\n`);
						res.end();
						return;
					}
					if (event.agent && event.agent.messages && event.agent.messages.length > 0) {
						const messages = event.agent.messages;
						const content = messages.find((message: any) => message.content);
						if (content) {
							const messagesContent = content.content;
							if (typeof messagesContent === "string") {
								res.write(`data: {"type": "agent", "content": ${JSON.stringify(messagesContent)}}\n\n`);
							} else if (Array.isArray(messagesContent)) {
								const textMessages = messagesContent.filter((message: any) => message.type === "text");
								const textContent = textMessages.map((message: any) => message.text).join("\n");
								res.write(`data: {"type": "agent", "content": ${JSON.stringify(textContent)}}\n\n`);
							}
						}
					}
					if (event.tools) {
						for (const toolMessage of event.tools.messages) {
							if (typeof toolMessage.content === "string") {
								res.write(`data: {"type": "tool", "content": ${JSON.stringify(toolMessage.content)}}\n\n`);
							} else {
								const toolOutput = JSON.parse(toolMessage.content);
								res.write(`data: {"type": "tool", "content": ${JSON.stringify(toolOutput)}}\n\n`);
							}
						}
					}
				} catch (error) {
					console.error("Error in autonomous agent execution:", error);
				}
			}
		} catch (error) {
			console.error("Error in autonomous agent execution:", error);
			res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
		}

		// Pause for 1 minute
		console.log("Pausing for 1 minute...");
		res.write(`data: {"type": "agent", "content": "Pausing for 1 minute..."}\n\n`);
		await new Promise(resolve => setTimeout(resolve, 60000));

		// Restart the cycle
		console.log("Restarting agent...");
		res.write(`data: {"type": "agent", "content": "Restarting agent..."}\n\n`);
		runAgentCycle();
	}

	// Start the initial cycle
	runAgentCycle();
}

export function stopAutonomousAgent(): void {
	agentEmitter.emit('stop');
}





