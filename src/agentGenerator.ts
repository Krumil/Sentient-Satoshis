import { brianTools } from "./tools/brianTools";
import { navigateOnline } from "./tools/tavilyTools";
import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import type { ChatPromptTemplate } from "@langchain/core/prompts";

const model = new ChatAnthropic({
    temperature: 0.9,
    model: "claude-3-sonnet-20240229",
    // In Node.js defaults to process.env.ANTHROPIC_API_KEY,
    // apiKey: "YOUR-API-KEY",
    maxTokens: 1024,
});

const tools = [...brianTools, navigateOnline];

export async function generateAgent(prompt: string): Promise<string> {
    try {
        const agentPrompt = await pull<ChatPromptTemplate>("hwchase17/openai-functions-agent");
        
        const agent = await createOpenAIFunctionsAgent({
            llm: model,
            tools,
            prompt: agentPrompt,
        });

        const agentExecutor = new AgentExecutor({
            agent,
            tools,
            verbose: true,
        });

        const result = await agentExecutor.invoke({
            input: prompt,
        });

        return result.output;
    } catch (error) {
        console.error("Error generating agent response:", error);
        return "Sorry, I encountered an error while processing your request.";
    }
}

export { brianTools };
