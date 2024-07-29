import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatAnthropic } from "@langchain/anthropic";



const planSchema = z.object({
    steps: z.array(z.string()).describe("different steps to follow, should be in sorted order"),
});

const planTool = {
    type: "function",
    function: {
        name: "plan",
        description: "This tool is used to plan the steps to follow.",
        parameters: {
            type: "object",
            properties: {
                steps: {
                    type: "array",
                    items: { type: "string" },
                    description: "different steps to follow, should be in sorted order",
                },
            },
            required: ["steps"],
        },
    },
};

const plannerPrompt = ChatPromptTemplate.fromTemplate(
    `For the given objective, come up with a simple step by step plan. \
This plan should involve individual tasks, that if executed correctly will yield the correct answer. Do not add any superfluous steps. \
The result of the final step should be the final answer. Make sure that each step has all the information needed - do not skip steps.
Always plan at max 5 steps.
Specify the relevant info in the step like address and rpc url.

{objective}`,
);

const model = new ChatAnthropic({
    clientOptions: {
        defaultHeaders: {
            "X-Api-Key": process.env.ANTHROPIC_API_KEY,
        },
    },
    modelName: "claude-3-5-sonnet-20240620",
}).withStructuredOutput(planSchema);

const planner = plannerPrompt.pipe(model);

export { planner, planTool };