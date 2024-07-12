import { BrianSDK } from "@brian-ai/sdk";

const brian = new BrianSDK({
  apiKey: process.env.BRIAN_API_KEY || "",
});

export async function generateAgent(prompt: string): Promise<string> {
  try {
    const response = await brian.ask(prompt);
    return response;
  } catch (error) {
    console.error("Error generating response:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
}
