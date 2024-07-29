import dotenv from "dotenv";
import { BrianSDK, TransactionResult, TransactionData } from "@brian-ai/sdk";
import { ethers } from "ethers";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

dotenv.config();

interface ExtendedTransactionData extends TransactionData {
	amountToApprove?: string;
}

interface ExtendedTransactionResult extends Omit<TransactionResult, "data"> {
	data: ExtendedTransactionData;
}

const brian = new BrianSDK({
	apiKey: process.env.BRIAN_API_KEY || "",
});

const askBrianSchema = z.object({
	prompt: z.string().describe("The question to ask Brian AI"),
});

const extractParametersSchema = z.object({
	prompt: z.string().describe("The prompt to extract parameters from"),
});

const generateCodeSchema = z.object({
	prompt: z
		.string()
		.describe("The prompt to generate a Solidity Smart Contract"),
});

const transactSchema = z.object({
	prompt: z.string().describe(
		`The prompt to generate and execute transactions. 
			Use a different address receiver
			Follow those advices to make the prompt more clear:
				Never express how much token you want in output
				Write the "$" close to the token name
				Use percentage (eg. 25%, half of, 75%, 99%)
				Never use absolute amount
				Use "all my"
				Always specify the chain (eg. base)`
	),
	address: z
		.string()
		.describe("Address of the user that will send the transaction"),
	providerUrl: z
		.string()
		.describe("Ethers provider URL for the specified chain"),
});

export const askBrianTool = tool(
	async ({ prompt }) => {
		try {
			const response = await brian.ask({
				prompt: prompt,
				kb: "public-knowledge-box",
			});
			console.log("Response from Brian AI:", response.text);
			return response.text;
		} catch (error: any) {
			console.error("Error in askBrian:", error);
			return "Sorry, I encountered an error while processing your request.";
		}
	},
	{
		name: "AskBrian",
		description:
			"Ask Brian AI a question about specific question about crypto and get a response.",
		schema: askBrianSchema,
	}
);

export const extractTool = tool(
	async ({ prompt }) => {
		try {
			const parameters = await brian.extract({ prompt: prompt });
			return JSON.stringify(parameters);
		} catch (error) {
			console.error("Error in extractParameters:", error);
			return "Sorry, I encountered an error while extracting parameters.";
		}
	},
	{
		name: "ExtractParameters",
		description: "Extract parameters from a given prompt.",
		schema: extractParametersSchema,
	}
);

export const generateCodeTool = tool(
	async ({ prompt }) => {
		try {
			const code = await brian.generateCode({ prompt: prompt });
			return JSON.stringify(code);
		} catch (error) {
			console.error("Error in generateCode:", error);
			return "Sorry, I encountered an error while generating the smart contract.";
		}
	},
	{
		name: "GenerateCode",
		description: "Generate a Solidity Smart Contract based on a prompt.",
		schema: generateCodeSchema,
	}
);

const ERC20_ABI = [
	"function allowance(address owner, address spender) view returns (uint256)",
	"function approve(address spender, uint256 amount) returns (bool)",
];

async function checkAndApproveToken(
	wallet: ethers.Wallet,
	tokenAddress: string,
	tokenName: string,
	spenderAddress: string,
	amountToApprove: string,
	decimals: number
) {
	if (tokenName === "ETH") {
		console.log("ETH does not require approval");
		return;
	}
	const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
	const amountInWei = ethers.parseUnits(amountToApprove, decimals);

	try {
		const currentAllowance: bigint = await tokenContract.allowance(
			wallet.address,
			spenderAddress
		);

		if (currentAllowance < amountInWei) {
			console.log(`Approving ${amountToApprove} tokens...`);
			const approvalTx = await tokenContract.approve(
				spenderAddress,
				amountInWei
			);
			await approvalTx.wait();
			console.log("Approval transaction confirmed");
		} else {
			console.log("Sufficient allowance already exists");
		}
	} catch (error) {
		console.error("Error in checkAndApproveToken:", error);
		throw new Error(
			`Failed to check or approve token: ${(error as Error).message}`
		);
	}
}

export const transactTool = tool(
	async ({ prompt, address, providerUrl }) => {
		try {
			console.log(
				`Attempting to transact with prompt: "${prompt}" and address: ${address}`
			);

			if (!prompt || typeof prompt !== "string") {
				throw new Error("Invalid prompt: prompt must be a non-empty string");
			}
			if (!address || typeof address !== "string") {
				throw new Error("Invalid address: address must be a non-empty string");
			}

			const transactionResponse: TransactionResult[] = await brian.transact({
				prompt: prompt,
				address: address,
			});

			console.log(
				"Transaction response:",
				JSON.stringify(transactionResponse, null, 4)
			);

			let executionResults = [];

			if (!process.env.PRIVATE_KEY) {
				throw new Error("PRIVATE_KEY is not set in environment variables");
			}

			const provider = new ethers.JsonRpcProvider(providerUrl);
			const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

			for (const result of transactionResponse as ExtendedTransactionResult[]) {
				console.log(`Processing action: ${result.action}`);

				if (result.data && result.data.steps) {
					const { fromToken, amountToApprove } = result.data;

					if (!fromToken) {
						throw new Error("Invalid transaction data: fromToken is required");
					}

					for (const step of result.data.steps) {
						console.log(`Preparing to execute step: ${JSON.stringify(step)}`);

						const spenderAddress = step.to;

						if (amountToApprove) {
							await checkAndApproveToken(
								wallet,
								fromToken.address,
								fromToken.name,
								spenderAddress,
								amountToApprove,
								fromToken.decimals
							);
						}

						const tx = await wallet.sendTransaction({
							to: step.to,
							data: step.data,
							value: step.value,
						});

						console.log(`Transaction sent: ${tx.hash}`);
						const receipt = await tx.wait();

						if (!receipt) {
							throw new Error(`Transaction failed: ${tx.hash}`);
						}

						executionResults.push({
							action: result.action,
							step: step,
							txHash: receipt.hash,
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
		} catch (error: any) {
			console.error("Error in transact:", error);
			let errorMessage = error.message;
			if (error.cause) {
				errorMessage += `: ${error.cause.error}`;
			}
			return `Error in transact: ${errorMessage}`;
		}
	},
	{
		name: "Transact",
		description:
			"Generate and execute one or more transactions based on a prompt.",
		schema: transactSchema,
	}
);

export const brianTools = [
	askBrianTool,
	// extractTool,
	// generateCodeTool,
	transactTool,
];
