import { END, START, StateGraph } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { planExecuteState, PlanExecuteState } from "./state.js";
import { agentExecutor } from "./executionAgent.js";
import { planner } from "./planningStep.js";
import { replanner } from "./rePlanSteps.js";
import { MemorySaver } from "@langchain/langgraph";

async function executeStep(
    state: PlanExecuteState,
    config?: RunnableConfig,
): Promise<Partial<PlanExecuteState>> {
    const task = state.plan[0];
    const input = {
        messages: ["user", task],
    };
    const { messages } = await agentExecutor.invoke(input, config);

    return {
        pastSteps: [[task, messages[messages.length - 1].content.toString()]],
        plan: state.plan.slice(1),
    };
}

async function planStep(
    state: PlanExecuteState,
): Promise<Partial<PlanExecuteState>> {
    const plan = await planner.invoke({ objective: state.input });
    return { plan: plan.steps };
}


async function replanStep(
    state: PlanExecuteState,
): Promise<Partial<PlanExecuteState>> {
    const output = await replanner.invoke({
        input: state.input,
        plan: state.plan.join("\n"),
        pastSteps: state.pastSteps
            .map(([step, result]) => `${step}: ${result}`)
            .join("\n"),
    });
    const responses = output.content as Array<{ type: string; input?: { text?: string; steps?: string[] } }>;
    const toolCall = responses[0];

    if (toolCall && toolCall.type == "response") {
        return { response: toolCall.input?.text };
    }

    return { plan: toolCall.input?.steps };
}


function shouldEnd(state: PlanExecuteState) {
    return state.response ? "true" : "false";
}

const workflow = new StateGraph({
    channels: planExecuteState,
})
    .addNode("planner", planStep)
    .addNode("agent", executeStep)
    .addNode("replan", replanStep)
    .addEdge(START, "planner")
    .addEdge("planner", "agent")
    .addEdge("agent", "replan")
    .addConditionalEdges("replan", shouldEnd, {
        true: END,
        false: "agent",
    });

const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });


export { app };