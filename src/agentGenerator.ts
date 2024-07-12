import { brianTools } from "./tools/brianTools";
import { navigateOnline } from "./tools/tavilyTools";
import { ChatOpenAI } from "@langchain/openai";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import { pull } from "langchain/hub";
import type { ChatPromptTemplate } from "@langchain/core/prompts";

const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0,
});

const tools = [...brianTools, navigateOnline];

export async function generateAgent(prompt: string): Promise<string> {
    try {
        const agentPrompt = await pull<ChatPromptTemplate>("hwchase17/openai-functions-agent");
        
        const agent = await createOpenAIFunctionsAgent({
            llm,
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
