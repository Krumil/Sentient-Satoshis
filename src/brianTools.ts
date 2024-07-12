import { BrianSDK } from "@brian-ai/sdk";

const brian = new BrianSDK({
    apiKey: process.env.BRIAN_API_KEY || "",
});

export const brianTools = {
    askBrian: async (prompt: string): Promise<string> => {
        try {
            const response = await brian.ask(prompt);
            return response;
        } catch (error) {
            console.error("Error in askBrian:", error);
            return "Sorry, I encountered an error while processing your request.";
        }
    },

    generateImage: async (prompt: string): Promise<string> => {
        try {
            const image = await brian.generateImage(prompt);
            return image.url;
        } catch (error) {
            console.error("Error in generateImage:", error);
            return "Sorry, I encountered an error while generating the image.";
        }
    },

    summarizeText: async (text: string): Promise<string> => {
        try {
            const summary = await brian.summarize(text);
            return summary;
        } catch (error) {
            console.error("Error in summarizeText:", error);
            return "Sorry, I encountered an error while summarizing the text.";
        }
    }
};
