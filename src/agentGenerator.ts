import { OpenAI } from "langchain/llms/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { SerpAPI } from "langchain/tools";
import { Calculator } from "langchain/tools/calculator";
import { ChatPromptTemplate } from "langchain/prompts";
import { StateGraph, END, START } from "@langchain/langgraph";
import { RunnableConfig } from "langchain/schema/runnable";

interface PlanExecuteState {
	input: string;
	plan: string[];
	pastSteps: [string, string][];
	response?: string;
}

const planExecuteState = {
	input: {
		value: (left?: string, right?: string) => right ?? left ?? "",
	},
	plan: {
		value: (x?: string[], y?: string[]) => y ?? x ?? [],
		default: () => [],
	},
	pastSteps: {
		value: (x: [string, string][], y: [string, string][]) => x.concat(y),
		default: () => [],
	},
	response: {
		value: (x?: string, y?: string) => y ?? x,
		default: () => undefined,
	},
};

const model = new OpenAI({ temperature: 0 });
const tools = [new SerpAPI(), new Calculator()];

const executor = await initializeAgentExecutorWithOptions(tools, model, {
	agentType: "zero-shot-react-description",
	verbose: true,
});

const plannerPrompt = ChatPromptTemplate.fromTemplate(
	`For the given objective, come up with a simple step by step plan. 
  This plan should involve individual tasks, that if executed correctly will yield the correct answer. Do not add any superfluous steps. 
  The result of the final step should be the final answer. Make sure that each step has all the information needed - do not skip steps.

  {objective}`
);

const planner = plannerPrompt.pipe(model);

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

  Update your plan accordingly. If no more steps are needed and you can return to the user, then respond with that.
  Otherwise, fill out the plan.  
  Only add steps to the plan that still NEED to be done. Do not return previously done steps as part of the plan.`
);

const replanner = replannerPrompt.pipe(model);

async function executeStep(
	state: PlanExecuteState,
	config?: RunnableConfig
): Promise<Partial<PlanExecuteState>> {
	const task = state.plan[0];
	const input = {
		input: task,
	};
	const result = await executor.call(input, config);

	return {
		pastSteps: [[task, result.output]],
		plan: state.plan.slice(1),
	};
}

async function planStep(
	state: PlanExecuteState
): Promise<Partial<PlanExecuteState>> {
	const plan = await planner.invoke({ objective: state.input });
	return {
		plan: plan.content.split("\n").filter((step) => step.trim() !== ""),
	};
}

async function replanStep(
	state: PlanExecuteState
): Promise<Partial<PlanExecuteState>> {
	const output = await replanner.invoke({
		input: state.input,
		plan: state.plan.join("\n"),
		pastSteps: state.pastSteps
			.map(([step, result]) => `${step}: ${result}`)
			.join("\n"),
	});

	const newPlan = output.content
		.split("\n")
		.filter((step) => step.trim() !== "");

	if (newPlan.length === 0) {
		return { response: output.content };
	}

	return { plan: newPlan };
}

function shouldEnd(state: PlanExecuteState) {
	return state.response ? "true" : "false";
}

export async function generateAgent(prompt: string) {
	const workflow = new StateGraph<PlanExecuteState>({
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

	const app = workflow.compile();

	const config = { recursionLimit: 50 };
	const inputs = { input: prompt };

	let finalResponse = "";

	for await (const event of await app.stream(inputs, config)) {
		if (event.replan && event.replan.response) {
			finalResponse = event.replan.response;
		}
	}

	return finalResponse;
}
