import { JinaReaderServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new JinaReaderServer();
server.connect(new StdioServerTransport()).catch(console.error);
