import { BrianSDK } from "@brian-ai/sdk";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ethers } from "ethers";

const brian = new BrianSDK({
	apiKey: process.env.BRIAN_API_KEY || "",
});

// Create a provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://localhost:8545");

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

			let executionResults = [];

			for (const result of transactionResponse) {
				console.log(`Processing action: ${result.action}`);

				if (result.data.steps) {
					for (const step of result.data.steps) {
						const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
						const tx = await wallet.sendTransaction({
							to: step.to,
							value: ethers.parseEther(step.value),
							data: step.data,
							chainId: step.chainId,
						});
						const receipt = await tx.wait();

						executionResults.push({
							action: result.action,
							step: step,
							txHash: receipt.transactionHash,
						});

						console.log(`Executed transaction step: ${JSON.stringify(step)}`);
					}
				} else {
					console.log(`No steps to execute for action: ${result.action}`);
				}
			}

			return JSON.stringify({
				message: "Transactions executed successfully",
				details: transactionResponse,
				executionResults: executionResults,
			});
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
