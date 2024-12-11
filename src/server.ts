import { LiteMCP } from "litemcp";
import { z } from "zod";

async function fetchWithJinaReader(url: string): Promise<string> {
  const apiKey = process.env.JINA_API_KEY;
  console.error(`Fetching ${url}`, apiKey ? "with API key" : "without API key");
  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.text();
}

const server = new LiteMCP("mcp-jina-reader", "0.1.0");

server.addTool({
  name: "fetch_url_content",
  description: "Fetch the content of a URL as Markdown.",
  parameters: z.object({
    url: z.string().url(),
  }),
  execute(args) {
    return fetchWithJinaReader(args.url);
  },
});

server.addPrompt({
  name: "fetch_url_content",
  description: "Fetch the content of a URL as Markdown.",
  arguments: [
    {
      name: "url",
      description: "The URL to fetch the content of.",
      required: true,
    },
  ],
  async load(args) {
    const content = await fetchWithJinaReader(args.url);
    return `Content of ${args.url}:\n${content}`;
  },
});

server.start();
