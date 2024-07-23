import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { brianTools } from "./tools/brianTools";
import { tavilyTool } from "./tools/tavilyTools";
import path from "path";
import fs from "fs/promises";

const tools = [...brianTools, tavilyTool].map((tool) => ({
	name: tool.name,
	description: tool.description,
	input_schema: zodToJsonSchema(tool.schema),
}));

const model = new ChatAnthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
	model: "claude-3-5-sonnet-20240620",
	temperature: 0,
}).bind({
	tools: tools,
});

async function readPromptFromFile(filename: string): Promise<string> {
	const filePath = path.join(__dirname, filename);
	try {
		return await fs.readFile(filePath, "utf-8");
	} catch (error) {
		console.error(`Error reading prompt file: ${error}`);
		throw error;
	}
}

const prompt = ChatPromptTemplate.fromMessages([
	["system", readPromptFromFile("prompts/trading_decision.txt")],
	["human", "{input}"],
]);

const chain = prompt.pipe(model);

export async function executeAgent(): Promise<string> {
	try {
		const input =
			"Analyze the current market conditions and make a trade decision.";
		const response = await chain.invoke({ input });
		return JSON.stringify(response, null, 2);
	} catch (error) {
		console.error("Error executing agent:", error);
		return "Sorry, I encountered an error while processing your request.";
	}
}

export async function startAutonomousAgent(): Promise<void> {
	console.log("Starting autonomous agent...");
	while (true) {
		const result = await executeAgent();
		console.log("Agent execution result:", result);
		await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait for 1 minute
	}
}
