import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { brianTools } from "./tools/brianTools";
import { tavilyTool } from "./tools/tavilyTools";

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

const prompt = ChatPromptTemplate.fromMessages([
	[
		"system",
		"You are an autonomous agent trading on the crypto market. Your goal is to make profitable trades. Analyze the market, make decisions, and execute trades.",
	],
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
