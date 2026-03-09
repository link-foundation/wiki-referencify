---
'wiki-referencify': major
---

Initialize repository with prototype of the globally installable npm CLI tool named `wiki-referencify`

This implements the core functionality of the `wiki-referencify` tool:

- **CLI tool**: Globally installable npm package with `wiki-referencify` binary
- **Wikipedia API integration**: Real Wikipedia API with file-based caching to avoid rate limits
- **Longest-match algorithm**: Prefers longest sequences of words that match a single Wikipedia article
- **Disambiguation support**: Links to disambiguation pages when they exist (as per spec)
- **Auto-disambiguation**: `--auto-disambiguation` flag to skip ambiguous terms and use direct article links
- **Markdown-aware processing**: Skips headers, existing links, code blocks, table headers, and formatting markers
- **Stopword filtering**: Avoids linking trivial common words
- **stdin/file input**: Reads markdown from a file argument or stdin
- **lino-arguments**: Uses `lino-arguments` package for CLI option parsing with environment variable support
