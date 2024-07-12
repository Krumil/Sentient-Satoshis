import { BrianSDK } from "@brian-ai/sdk";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const brian = new BrianSDK({
	apiKey: process.env.BRIAN_API_KEY || "",
});

export const askBrianTool = new DynamicStructuredTool({
	name: "AskBrian",
	description: "Ask Brian AI a question and get a response.",
	schema: z.object({
		prompt: z.string().describe("The question to ask Brian AI"),
	}),
	func: async ({ prompt }) => {
		try {
			const response = await brian.ask({ prompt: prompt });
			return JSON.stringify(response);
		} catch (error) {
			console.error("Error in askBrian:", error);
			return "Sorry, I encountered an error while processing your request.";
		}
	},
});

export const extractTool = new DynamicStructuredTool({
	name: "ExtractParameters",
	description: "Extract parameters from a given prompt.",
	schema: z.object({
		prompt: z.string().describe("The prompt to extract parameters from"),
	}),
	func: async ({ prompt }) => {
		try {
			const parameters = await brian.extract({ prompt: prompt });
			return JSON.stringify(parameters);
		} catch (error) {
			console.error("Error in extractParameters:", error);
			return "Sorry, I encountered an error while extracting parameters.";
		}
	},
});

export const generateCodeTool = new DynamicStructuredTool({
	name: "GenerateCode",
	description: "Generate a Solidity Smart Contract based on a prompt.",
	schema: z.object({
		prompt: z
			.string()
			.describe("The prompt to generate a Solidity Smart Contract"),
	}),
	func: async ({ prompt }) => {
		try {
			const code = await brian.generateCode({ prompt: prompt });
			return JSON.stringify(code);
		} catch (error) {
			console.error("Error in generateCode:", error);
			return "Sorry, I encountered an error while generating the smart contract.";
		}
	},
});

export const transactTool = new DynamicStructuredTool({
	name: "Transact",
	description: "Generate one or more transactions based on a prompt.",
	schema: z.object({
		prompt: z.string().describe("The prompt to generate transactions"),
	}),
	func: async ({ prompt }) => {
		try {
			const transactions = await brian.transact({ prompt: prompt });
			return JSON.stringify(transactions);
		} catch (error) {
			console.error("Error in transact:", error);
			return "Sorry, I encountered an error while generating transactions.";
		}
	},
});

export const brianTools = [
	askBrianTool,
	extractTool,
	generateCodeTool,
	transactTool,
];
