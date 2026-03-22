#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import { z } from "zod";
import { locus } from "./locus.js";

function createLocusServer(): McpServer {
  const server = new McpServer({
    name: "locus-mcp",
    version: "0.2.0",
  });

  // ── Spaces ──────────────────────────────────────────────────────────────────

  server.registerTool(
    "list_spaces",
    { description: "List all dataspaces in Locus" },
    async () => {
      const data = await locus("/spaces");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "create_space",
    {
      description: "Create a new dataspace in Locus",
      inputSchema: { name: z.string().describe("Name of the dataspace to create") },
    },
    async ({ name }) => {
      const data = await locus("/spaces", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "delete_space",
    {
      description: "Delete a dataspace and all its documents from Locus",
      inputSchema: { space: z.string().describe("Name of the dataspace to delete") },
    },
    async ({ space }) => {
      const data = await locus(`/spaces/${encodeURIComponent(space)}`, { method: "DELETE" });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ── Documents ───────────────────────────────────────────────────────────────

  server.registerTool(
    "list_documents",
    {
      description: "List all documents in a Locus dataspace",
      inputSchema: { space: z.string().describe("Name of the dataspace") },
    },
    async ({ space }) => {
      const data = await locus(`/spaces/${encodeURIComponent(space)}/documents`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "ingest_document",
    {
      description: "Ingest a text document into a Locus dataspace",
      inputSchema: {
        space: z.string().describe("Name of the dataspace"),
        text: z.string().describe("Text content to ingest"),
        filename: z.string().optional().describe("Optional filename label for the document"),
      },
    },
    async ({ space, text, filename }) => {
      const body: Record<string, string> = { text };
      if (filename) body.filename = filename;
      const data = await locus(`/spaces/${encodeURIComponent(space)}/documents`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "get_document",
    {
      description: "Retrieve the full text of a document by its ID from a Locus dataspace",
      inputSchema: {
        space: z.string().describe("Name of the dataspace"),
        doc_id: z.string().describe("Document ID to retrieve"),
      },
    },
    async ({ space, doc_id }) => {
      const data = await locus(
        `/spaces/${encodeURIComponent(space)}/documents/${encodeURIComponent(doc_id)}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "delete_document",
    {
      description: "Delete a document by its ID from a Locus dataspace",
      inputSchema: {
        space: z.string().describe("Name of the dataspace"),
        doc_id: z.string().describe("Document ID to delete"),
      },
    },
    async ({ space, doc_id }) => {
      const data = await locus(
        `/spaces/${encodeURIComponent(space)}/documents/${encodeURIComponent(doc_id)}`,
        { method: "DELETE" }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ── Search ───────────────────────────────────────────────────────────────────

  server.registerTool(
    "search",
    {
      description: "Semantic search over documents in a Locus dataspace using natural language",
      inputSchema: {
        space: z.string().describe("Name of the dataspace to search"),
        query: z.string().describe("Natural language search query"),
        k: z.number().int().min(1).max(50).optional().default(5).describe("Number of results to return (1–50, default 5)"),
        full: z.boolean().optional().default(false).describe("Include full document text with each result"),
      },
    },
    async ({ space, query, k, full }) => {
      const params = new URLSearchParams({ q: query, k: String(k), full: String(full) });
      const data = await locus(`/spaces/${encodeURIComponent(space)}/search?${params}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ── Settings & Health ────────────────────────────────────────────────────────

  server.registerTool(
    "health_check",
    { description: "Check if the Locus service is healthy and reachable" },
    async () => {
      const data = await locus("/health");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "get_settings",
    { description: "Get the current Locus settings (Ollama URL and embedding model)" },
    async () => {
      const data = await locus("/settings");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    "update_settings",
    {
      description: "Update Locus settings (Ollama URL and/or embedding model). Only works if settings are not locked via environment variables.",
      inputSchema: {
        ollama_url: z.string().url().optional().describe("New Ollama base URL"),
        embed_model: z.string().optional().describe("New embedding model name (e.g. nomic-embed-text)"),
      },
    },
    async ({ ollama_url, embed_model }) => {
      const body: Record<string, string> = {};
      if (ollama_url) body.ollama_url = ollama_url;
      if (embed_model) body.embed_model = embed_model;
      const data = await locus("/settings", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  return server;
}

// ── Start ─────────────────────────────────────────────────────────────────────

const port = process.env.PORT ? parseInt(process.env.PORT) : null;

if (port) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await createLocusServer().connect(transport);

  const httpServer = createServer((req, res) => {
    transport.handleRequest(req, res).catch((err) => {
      process.stderr.write(`Error handling request: ${err}\n`);
      res.writeHead(500).end();
    });
  });

  httpServer.listen(port, () => {
    process.stderr.write(`locus-mcp listening on :${port}\n`);
  });
} else {
  const transport = new StdioServerTransport();
  await createLocusServer().connect(transport);
}
