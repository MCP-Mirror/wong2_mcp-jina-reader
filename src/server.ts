import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const FetchUrlArgsSchema = z.object({
  url: z.string().url(),
});

export class JinaReaderServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "mcp-jina-reader",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private async fetchWithJinaReader(url: string): Promise<string> {
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

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "fetch_url_content",
            description: "Fetch the content of a URL as Markdown.",
            inputSchema: zodToJsonSchema(FetchUrlArgsSchema),
          },
        ],
      };
    });
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      switch (name) {
        case "fetch_url_content": {
          const parsed = FetchUrlArgsSchema.parse(args);
          const content = await this.fetchWithJinaReader(parsed.url);
          return {
            content: [{ type: "text", text: content }],
          };
        }
        default: {
          throw new Error(`Unknown tool: ${name}`);
        }
      }
    });
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }
}
