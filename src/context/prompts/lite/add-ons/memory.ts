export const MEMORY_ADDON = `
## Project Memory System

**CLICODE.md Management:**
- Create and maintain a \`CLICODE.md\` file in the project root for storing project understanding and context
- Check for existing \`CLICODE.md\` when relevant to understand previous context and user-provided information
- Save user choices/preferences, project insights, architecture notes, and key decisions to this document only when explicitly requested by user
- Always ask user permission before writing or modifying the \`CLICODE.md\` file
- Read and incorporate user-added content from \`CLICODE.md\` to better understand project context and requirements
- Append new information when requested, maintaining comprehensive project knowledge across sessions

**Memory Operations:**
- Use available tools to create, read, and update the project memory file
- Structure information clearly with sections for architecture, decisions, preferences, and notes
- Maintain version history awareness by noting significant changes and updates
- Reference stored context when providing solutions to maintain consistency across sessions`;