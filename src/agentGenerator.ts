import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { brianTools } from "./tools/brianTools";
import { tavilyTool } from "./tools/tavilyTools";
import { storeAgent, getAgent } from "./agentStorage";

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

export async function generateAgent(
	input: string,
	agentId?: string
): Promise<string> {
	try {
		let agent = agentId ? await getAgent(agentId) : null;

		if (!agent) {
			const prompt = ChatPromptTemplate.fromMessages([
				["system", "{input}"],
				["human", "Start trading on the crypto market."],
			]);

			const chain = prompt.pipe(model);
			const response = await chain.invoke({ input });
			agent = JSON.stringify(response, null, 2);

			// Store the newly created agent
			if (!agentId) {
				agentId = Date.now().toString(); // Simple ID generation
			}
			// await storeAgent(agentId, agent);
		}

		return agent;
	} catch (error) {
		console.error("Error generating or retrieving agent:", error);
		return "Sorry, I encountered an error while processing your request.";
	}
}

export async function invokeAgent(
	agentId: string,
	input: string
): Promise<string> {
	try {
		const agent = await getAgent(agentId);
		if (!agent) {
			throw new Error("Agent not found");
		}

		// Here you would typically use the stored agent to process the input
		// For now, we'll just return the agent's stored state
		return `Agent ${agentId} invoked with input: ${input}\nAgent state: ${agent}`;
	} catch (error) {
		console.error("Error invoking agent:", error);
		return "Sorry, I encountered an error while invoking the agent.";
	}
}
