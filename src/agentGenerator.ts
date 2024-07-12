import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { brianTools } from "./tools/brianTools";
import { navigateOnline } from "./tools/tavilyTools";

const tools = [...brianTools, navigateOnline].map((tool) => ({
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

export async function generateAgent(input: string): Promise<string> {
	try {
		const prompt = ChatPromptTemplate.fromMessages([
			[
				"system",
				"You are a helpful assistant with access to various tools. Use them when necessary.",
			],
			["human", "{input}"],
		]);

		const chain = prompt.pipe(model);
		const response = await chain.invoke({ input });
		return JSON.stringify(response, null, 2);
	} catch (error) {
		console.error("Error generating agent response:", error);
		return "Sorry, I encountered an error while processing your request.";
	}
}
