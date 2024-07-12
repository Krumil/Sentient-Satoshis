import { askBrian, generateImage, summarizeText } from "./tools/brianTools";

export async function generateAgent(prompt: string): Promise<string> {
    try {
        const response = await askBrian(prompt);
        return response;
    } catch (error) {
        console.error("Error generating response:", error);
        return "Sorry, I encountered an error while processing your request.";
    }
}

export { generateImage, summarizeText };
