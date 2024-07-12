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

export const extractTool = new DynamicTool({
	name: "ExtractParameters",
	description: "Extract parameters from a given prompt.",
	func: async (prompt: string) => {
		try {
			const parameters = await brian.extract(prompt);
			return JSON.stringify(parameters);
		} catch (error) {
			console.error("Error in extractParameters:", error);
			return "Sorry, I encountered an error while extracting parameters.";
		}
	},
});

export const generateCodeTool = new DynamicTool({
	name: "GenerateCode",
	description: "Generate a Solidity Smart Contract based on a prompt.",
	func: async (prompt: string) => {
		try {
			const code = await brian.generateCode(prompt);
			return code;
		} catch (error) {
			console.error("Error in generateCode:", error);
			return "Sorry, I encountered an error while generating the smart contract.";
		}
	},
});

export const transactTool = new DynamicTool({
	name: "Transact",
	description: "Generate one or more transactions based on a prompt.",
	func: async (prompt: string) => {
		try {
			const transactions = await brian.transact(prompt);
			return JSON.stringify(transactions);
		} catch (error) {
			console.error("Error in transact:", error);
			return "Sorry, I encountered an error while generating transactions.";
		}
	},
});

export const brianTools = [askBrianTool, extractTool, generateCodeTool, transactTool];
