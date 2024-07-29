import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatAnthropic } from "@langchain/anthropic";
import { planTool } from "./planningStep.js";

const llm = new ChatAnthropic({
    clientOptions: {
        defaultHeaders: {
            "X-Api-Key": process.env.ANTHROPIC_API_KEY,
        },
    },
    modelName: "claude-3-5-sonnet-20240620",
});

const response = zodToJsonSchema(
    z.object({
        response: z.string().describe("Response to user."),
    }),
);

const responseTool = {
    type: "function",
    function: {
        name: "response",
        description: "Response to user.",
        parameters: response,
    },
};

const replannerPrompt = ChatPromptTemplate.fromTemplate(
    `For the given objective, come up with a simple step by step plan. 
This plan should involve individual tasks, that if executed correctly will yield the correct answer. Do not add any superfluous steps.
The result of the final step should be the final answer. Make sure that each step has all the information needed - do not skip steps.

Your objective was this:
{input}

Your original plan was this:
{plan}

You have currently done the follow steps:
{pastSteps}

Update your plan accordingly. If no more steps are needed and you can return to the user, then respond with that and use the 'response' function.
Otherwise, fill out the plan.  
Only add steps to the plan that still NEED to be done. Do not return previously done steps as part of the plan.`,
);

const tools = [planTool, responseTool];
const replanner = replannerPrompt
    .pipe(
        llm.bind({
            tools,
            tool_choice: "any"
        }),
    );

export { replanner };