import { BrianSDK } from "@brian-ai/sdk";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ethers } from "ethers";

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
			const response = await brian.ask({
				prompt: prompt,
				kb: "public-knowledge-box",
			});
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
	description:
		"Generate and execute one or more transactions based on a prompt.",
	schema: z.object({
		prompt: z
			.string()
			.describe("The prompt to generate and execute transactions"),
		address: z
			.string()
			.describe("Address of the user that will send the transaction"),
	}),
	func: async ({ prompt, address }) => {
		try {
			const transactionResponse = await brian.transact({
				prompt: prompt,
				address: address,
			});

			if (
				transactionResponse.result &&
				transactionResponse.result.data &&
				transactionResponse.result.data.steps
			) {
				// Execute each step in the transaction
				for (const step of transactionResponse.result.data.steps) {
					const provider = new ethers.providers.JsonRpcProvider();
					const wallet = new ethers.Wallet(privateKey, provider);
					const tx = await wallet.sendTransaction({
						to: step.to,
						value: ethers.utils.parseEther(step.value),
						data: step.data,
						gasLimit: step.gasLimit,
					});
					await tx.wait();

					console.log(`Executed transaction step: ${JSON.stringify(step)}`);
				}

				return JSON.stringify({
					message: "Transactions executed successfully",
					details: transactionResponse.result.data,
				});
			} else {
				throw new Error("Invalid transaction response structure");
			}
		} catch (error) {
			console.error("Error in transact:", error);
			return "Sorry, I encountered an error while generating or executing transactions.";
		}
	},
});

export const brianTools = [
	askBrianTool,
	extractTool,
	generateCodeTool,
	transactTool,
];
