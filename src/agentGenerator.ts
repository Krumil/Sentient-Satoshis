import { brianTools } from "./tools/brianTools";

export async function generateAgent(prompt: string): Promise<string> {
    try {
        const response = await brianTools.askBrian(prompt);
        return response;
    } catch (error) {
        console.error("Error generating response:", error);
        return "Sorry, I encountered an error while processing your request.";
    }
}

export async function generateImage(prompt: string): Promise<string> {
    return await brianTools.generateImage(prompt);
}

export async function summarizeText(text: string): Promise<string> {
    return await brianTools.summarizeText(text);
}
