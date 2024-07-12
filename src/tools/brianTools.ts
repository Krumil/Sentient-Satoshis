import { BrianSDK } from "@brian-ai/sdk";
import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const brian = new BrianSDK({
	apiKey: process.env.BRIAN_API_KEY || "",
});

export const askBrianTool = new DynamicTool({
	name: "AskBrian",
	description: "Ask Brian AI a question and get a response.",
	func: async (prompt: string) => {
		try {
			const response = await brian.ask(prompt);
			return response;
		} catch (error) {
			console.error("Error in askBrian:", error);
			return "Sorry, I encountered an error while processing your request.";
		}
	},
});

export const generateImageTool = new DynamicTool({
	name: "GenerateImage",
	description: "Generate an image based on a text prompt.",
	func: async (prompt: string) => {
		try {
			const image = await brian.generateImage(prompt);
			return image.url;
		} catch (error) {
			console.error("Error in generateImage:", error);
			return "Sorry, I encountered an error while generating the image.";
		}
	},
});

export const summarizeTextTool = new DynamicStructuredTool({
	name: "SummarizeText",
	description: "Summarize a given text.",
	schema: z.object({
		text: z.string().describe("The text to summarize"),
	}),
	func: async ({ text }) => {
		try {
			const summary = await brian.summarize(text);
			return summary;
		} catch (error) {
			console.error("Error in summarizeText:", error);
			return "Sorry, I encountered an error while summarizing the text.";
		}
	},
});

export const brianTools = [askBrianTool, generateImageTool, summarizeTextTool];
