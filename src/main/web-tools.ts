import { app } from "electron";
import fs from "fs";
import path from "path";
import { getStateManager } from "./state";

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}

function getTavilyApiKey(): string {
  try {
    const state = getStateManager().store.store;
    if (state.settings?.tavilyApiKey) {
      return state.settings.tavilyApiKey;
    }
    return process.env.TAVILY_API_KEY || "";
  } catch {
    return process.env.TAVILY_API_KEY || "";
  }
}

export const WEB_TOOLS = {
  web_search: {
    name: "web_search",
    description:
      "Search the web for current information. Use this when you need up-to-date information, facts, news, or anything you don't know.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        num_results: {
          type: "number",
          description: "Number of results to return (default 5)",
        },
      },
      required: ["query"],
    },
  },

  fetch_url: {
    name: "fetch_url",
    description:
      "Fetch and summarize content from a URL. Use this to get details from a specific webpage.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch",
        },
      },
      required: ["url"],
    },
  },
};

export async function webSearch(
  query: string,
  numResults: number = 5,
): Promise<ToolResult> {
  const apiKey = getTavilyApiKey();

  if (!apiKey) {
    return {
      success: false,
      error:
        "Tavily API key not configured. Please add your Tavily API key in Settings > Advanced, or set the TAVILY_API_KEY environment variable. Get a free key at https://tavily.com",
    };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "advanced",
        max_results: numResults,
        include_answer: true,
        include_images: false,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Search failed: ${response.status}` };
    }

    const data = await response.json();

    const results: string[] = [];

    if (data.answer) {
      results.push(`📌 ${data.answer}`);
      results.push("");
    }

    if (data.results && data.results.length > 0) {
      results.push("📋 Results:");
      for (const result of data.results) {
        results.push(`  • ${result.title}`);
        results.push(`    ${result.url}`);
        if (result.content) {
          const snippet = result.content.substring(0, 200);
          results.push(`    ${snippet}...`);
        }
        results.push("");
      }
    }

    if (results.length === 0) {
      return { success: true, output: `No results found for "${query}".` };
    }

    return {
      success: true,
      output: `🔍 Search results for "${query}":\n\n${results.join("\n")}`,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function fetchUrl(url: string): Promise<ToolResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return { success: false, error: `Fetch failed: ${response.status}` };
    }

    const text = await response.text();

    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "No title";

    const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let content = bodyMatch
      ? bodyMatch[1]
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

    content = content.substring(0, 2000);

    return {
      success: true,
      output: `Page: ${title}\n\nURL: ${url}\n\nContent:\n${content}...`,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
