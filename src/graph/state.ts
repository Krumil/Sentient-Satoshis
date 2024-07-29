import { StateGraphArgs } from "@langchain/langgraph";

interface PlanExecuteState {
    input: string;
    plan: string[];
    pastSteps: [string, string][];
    response?: string;
}

const planExecuteState: StateGraphArgs<PlanExecuteState>["channels"] = {
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

export { planExecuteState, PlanExecuteState };
