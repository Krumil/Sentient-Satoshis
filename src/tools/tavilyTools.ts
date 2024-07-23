import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

export const tavilyTool = new TavilySearchResults({ 
    maxResults: 1,
    apiKey: process.env.TAVILY_API_KEY
});
