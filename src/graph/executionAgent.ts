import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import tools from "./tools.js";
import { getAvailableApis } from "../tools/apiTools.js";
import path from "path";
import fs from "fs/promises";


async function readPromptFromFile(filename: string): Promise<string> {
    const filePath = path.join(process.cwd(), filename);
    try {
        return await fs.readFile(filePath, "utf-8");
    } catch (error) {
        console.error(`Error reading prompt file: ${error}`);
        throw error;
    }
}

async function createInfoMessage(): Promise<string> {
    const today = new Date();
    let infoPrompt = await readPromptFromFile("prompts/info_prompt.txt");
    const address = "0x2dc62eB610423588064bac52773D068962444fc2";
    infoPrompt = infoPrompt.replace("{{today}}", today.toISOString());
    infoPrompt = infoPrompt.replace("{{address}}", address);
    infoPrompt = infoPrompt.replace("{{ALCHEMY_API_KEY}}", process.env.ALCHEMY_API_KEY ?? '');

    // get list of available apis
    const availableApis = await getAvailableApis();
    const apiPrompt = `Choose APIs to use from the following list:
	${availableApis.map((api: { name: string; description: string }) => `- ${api.name}: ${api.description}`).join("\n")}`;
    return `${infoPrompt}\n\n${apiPrompt}`;
}


const llm = new ChatAnthropic({
    clientOptions: {
        defaultHeaders: {
            "X-Api-Key": process.env.ANTHROPIC_API_KEY,
        },
    },
    modelName: "claude-3-haiku-20240307",
});

const systemMessage = await createInfoMessage();
const agentExecutor = createReactAgent({
    llm,
    tools,
    messageModifier: systemMessage,
});

export { agentExecutor };