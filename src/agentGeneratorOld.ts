import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { brianTools } from "./tools/brianTools.js";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getTradableTokensTool, getTokenBalancesTool } from "./tools/lifiTools.js";
import { callApi, getAvailableApis } from "./tools/apiTools.js";
import { tavilyTool } from "./tools/tavilyTools.js";
import { setTimeout } from 'timers/promises';
import util from "util";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

const tools = [
	...brianTools,
	tavilyTool,
	getTradableTokensTool,
	// getMultiChainInfoAndBalances,
	getTokenBalancesTool,
	callApi,
];

const llm = new ChatAnthropic({
	clientOptions: {
		defaultHeaders: {
			"X-Api-Key": process.env.ANTHROPIC_API_KEY,
		},
	},
	modelName: "claude-3-haiku-20240307",
	// modelName: "claude-3-5-sonnet-20240620",
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

	const today = new Date();
	let defaultPrompt = await readPromptFromFile("prompts/default_prompt.txt");
	const address = "0x2dc62eB610423588064bac52773D068962444fc2";
	defaultPrompt = defaultPrompt.replace("{{today}}", today.toISOString());
	defaultPrompt = defaultPrompt.replace("{{address}}", address);
	defaultPrompt = defaultPrompt.replace("{{ALCHEMY_API_KEY}}", process.env.ALCHEMY_API_KEY ?? '');

	// get list of available apis
	const availableApis = await getAvailableApis();
	const apiPrompt = `Choose APIs to use from the following list:
	${availableApis.map((api: { name: string; description: string }) => `- ${api.name}: ${api.description}`).join("\n")}`;
	return `${defaultPrompt}\n\n${tradingPrompt}\n\n${apiPrompt}`;
}

function logAgentStep(step: any): string | null {
	let finalAnswer: string | null = null;

	if (step.agent) {
		const agentMessage = step.agent.messages[step.agent.messages.length - 1];
		if (
			agentMessage.additional_kwargs &&
			agentMessage.additional_kwargs.stop_reason === "tool_use"
		) {
			const toolCall =
				agentMessage.tool_calls[agentMessage.tool_calls.length - 1];
			console.log("Tool Call Name:", toolCall.name);
			console.log("Tool Call Args:", toolCall.args);
		}
	}
	if (step.tools) {
		for (const toolMessage of step.tools.messages) {
			if (typeof toolMessage.content === "string") {
				console.log(toolMessage.content);
			} else {
				const toolOutput = JSON.parse(toolMessage.content);
				console.log(util.inspect(toolOutput, { colors: true }));
			}
		}
	}
	if (step.agent) {
		const agentMessage = step.agent.messages[step.agent.messages.length - 1];
		if (agentMessage.content) {
			console.log(agentMessage.content);
			finalAnswer = agentMessage.content;
		}
	}

	return finalAnswer;
}

export async function executeAgent(app: any): Promise<string> {
	try {
		const config = {
			configurable: {
				thread_id: "trading-agent-thread",
			},
			recursionLimit: 10 * 2 + 1,
		};

		console.log("Starting agent execution...");

		const stream = await app.stream(
			{
				messages: [new HumanMessage("Start trading")],
			},
			{ ...config, streamMode: "updates" }
		);

		let finalAnswer: string | null = null;

		for await (const step of stream) {
			const stepResult = logAgentStep(step);
			if (stepResult) {
				finalAnswer = stepResult;
			}
		}

		if (!finalAnswer) {
			console.log("\nNo final answer was generated.");
		}

		return finalAnswer || "No final answer was generated.";
	} catch (error) {
		console.error("Error executing agent:", error);
		return "Sorry, I encountered an error while processing your request.";
	}
}

export async function startAutonomousAgent(): Promise<void> {
	console.log("Starting autonomous agent...");
	const systemMessage = await createSystemMessage();
	const memory = new MemorySaver();

	const app = createReactAgent({
		llm,
		tools,
		messageModifier: systemMessage,
		checkpointSaver: memory,
	});

	const result = await executeAgent(app);
	console.log("Agent execution completed.");
	console.log("Result:", result);
}

