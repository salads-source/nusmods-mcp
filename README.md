# NUSMods MCP Server

Model Context Protocol server for NUSMods course search, module details, timetable conflict checking, timetable generation, and NUSMods share URL export.

## Usage

```bash
npx nusmods-mcp
```

The default transport is stdio for local MCP clients. For hosted-compatible Streamable HTTP:

```bash
npx nusmods-mcp --transport http --port 3000
```

The server exposes one MCP endpoint at `/mcp`.

## Configuration

- `NUSMODS_ACAD_YEAR`: default academic year, e.g. `2025-2026`.
- `NUSMODS_CACHE_TTL_MS`: in-memory NUSMods cache TTL in milliseconds. Defaults to 12 hours.

## Development

```bash
npm install
npm run build
npm test
```

## Tools

- `search_modules`
- `get_module_details`
- `get_module_timetable`
- `check_timetable_conflicts`
- `generate_timetable`
- `export_nusmods_url`
