import { brianTools } from "../tools/brianTools.js";
import { getTradableTokensTool, getTokenBalancesTool } from "../tools/lifiTools.js";
import { callApi, getAvailableApis } from "../tools/apiTools.js";
import { tavilyTool } from "../tools/tavilyTools.js";

const tools = [
    ...brianTools,
    tavilyTool,
    getTradableTokensTool,
    getTokenBalancesTool,
    callApi,
];

export default tools;