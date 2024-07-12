import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { brianTools } from "./tools/brianTools";
import { navigateOnline } from "./tools/tavilyTools";

const llm = new ChatAnthropic({
  model: "claude-3-sonnet-20240229",
  temperature: 0,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant"],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const tools = [...brianTools, navigateOnline];

export async function generateAgent(input: string): Promise<string> {
  try {
    const agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });

    const { output } = await agentExecutor.invoke({ input });

    return output;
  } catch (error) {
    console.error("Error generating agent response:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
}

export { brianTools };
