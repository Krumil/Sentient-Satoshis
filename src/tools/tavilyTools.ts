import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const tavily = new TavilySearchAPIClient(process.env.TAVILY_API_KEY || "");

export const navigateOnline = new DynamicStructuredTool({
	name: "NavigateOnline",
	description: "Search for information online using Tavily Search API",
	schema: z.object({
		query: z.string().describe("The search query"),
	}),
	func: async ({ query }) => {
		try {
			const response = await tavily.search({
				query: query,
				search_depth: "advanced",
				include_answer: true,
				include_images: false,
				include_raw_content: false,
			});

			if (response.answer) {
				return response.answer;
			} else if (response.results && response.results.length > 0) {
				return response.results[0].content;
			} else {
				return "No relevant information found.";
			}
		} catch (error) {
			console.error("Error in navigateOnline:", error);
			return "Sorry, I encountered an error while searching online.";
		}
	},
});
