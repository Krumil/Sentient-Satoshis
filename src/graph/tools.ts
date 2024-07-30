import { brianTools } from "../tools/brianTools.js";
import { getTradableTokensTool, getTokenBalancesTool } from "../tools/lifiTools.js";
import { tavilyTool } from "../tools/tavilyTools.js";
import { getNewsTool } from "../tools/newsTools.js";

const tools = [
    ...brianTools,
    tavilyTool,
    getTradableTokensTool,
    getTokenBalancesTool,
    getNewsTool,
];

export default tools;