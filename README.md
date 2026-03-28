# locus-mcp

MCP server for [Locus](https://github.com/miguelaperez/locus) — a local semantic dataspace manager powered by Ollama.

Exposes all Locus HTTP endpoints as MCP tools so any MCP-compatible client (Claude Desktop, Cursor, etc.) can manage dataspaces, ingest documents, and run semantic search.

## Requirements

- [Locus](https://github.com/miguelaperez/locus) running locally or remotely
- Node.js 18+

## Installation

```bash
npm install -g @miguelaperez/locus-mcp --registry=https://npm.pkg.github.com
```

Or run directly with npx (package is on GitHub, not the npm registry):

```bash
npx github:MiguelAPerez/locus-mcp
```

> **Note:** `@miguelaperez/locus-mcp` is a GitHub Packages package, not published to the public npm registry. Using `npx @miguelaperez/locus-mcp` (without `github:`) will fail unless you've configured your npm registry. Use `github:MiguelAPerez/locus-mcp` instead.

## Configuration

| Environment variable | Default                  | Description              |
| -------------------- | ------------------------ | ------------------------ |
| `LOCUS_URL`          | `http://localhost:8000`  | Base URL of the Locus API |

## MCP client setup

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "locus": {
      "command": "npx",
      "args": ["-y", "github:MiguelAPerez/locus-mcp"],
      "env": {
        "LOCUS_URL": "http://localhost:8000"
      }
    }
  }
}
```

### Cursor / other clients

```json
{
  "locus": {
    "command": "npx",
    "args": ["-y", "github:MiguelAPerez/locus-mcp"],
    "env": {
      "LOCUS_URL": "http://localhost:8000"
    }
  }
}
```

### mcpo (HTTP proxy)

```json
{
  "mcpServers": {
    "locus": {
      "command": "npx",
      "args": ["-y", "github:MiguelAPerez/locus-mcp"],
      "env": {
        "LOCUS_URL": "http://locus:8000"
      }
    }
  }
}
```

## Tools

### Spaces

| Tool | Description |
| ---- | ----------- |
| `list_spaces` | List all dataspaces |
| `create_space` | Create a new dataspace |
| `delete_space` | Delete a dataspace and all its documents |

### Documents

| Tool | Description |
| ---- | ----------- |
| `list_documents` | List all documents in a dataspace |
| `ingest_document` | Ingest text into a dataspace |
| `get_document` | Retrieve full text of a document by ID |
| `delete_document` | Delete a document by ID |

### Search

| Tool | Description |
| ---- | ----------- |
| `search` | Semantic search over a dataspace (`query`, `k`, `full`) |

### Settings & health

| Tool | Description |
| ---- | ----------- |
| `health_check` | Check if Locus is reachable |
| `get_settings` | Get current Ollama URL and embedding model |
| `update_settings` | Update Ollama URL and/or embedding model |

## Development

```bash
npm install
npm run dev      # watch mode
npm test         # run tests
npm run build    # compile to dist/
```

## License

MIT
