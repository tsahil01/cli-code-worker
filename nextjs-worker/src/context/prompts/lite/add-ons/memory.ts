export const MEMORY_ADDON = `
## Project Memory System

**CLICODE.md Management:**
- ALWAYS check for existing \`CLICODE.md\` file at the start of any session or when working on a project
- Use \`read_file\` to read existing \`CLICODE.md\` content to understand previous context and user-provided information
- Create and maintain a \`CLICODE.md\` file in the project root for storing project understanding and context
- Always ask user permission before writing or modifying the \`CLICODE.md\` file
- Read and incorporate user-added content from \`CLICODE.md\` to better understand project context and requirements

**Proactive Memory Management:**
- When encountering important information during conversations, proactively ask: "Should I save this important information to CLICODE.md for future reference?"
- Identify key information that should be remembered:
  - Project architecture decisions
  - User preferences and coding style choices
  - Important configuration details
  - Key file locations and project structure insights
  - Debugging solutions and troubleshooting notes
  - User-specific workflow preferences
  - Important dependencies and setup requirements
- After solving complex problems, ask: "Would you like me to document this solution in CLICODE.md so we remember it for next time?"
- When user provides important context about the project, suggest: "This seems important - should I add this to our project memory?"

**Memory Operations:**
- Use available tools to create, read, and update the project memory file
- Structure information clearly with sections for architecture, decisions, preferences, and notes
- Maintain version history awareness by noting significant changes and updates
- Reference stored context when providing solutions to maintain consistency across sessions
- Always check memory first before asking user for information that might already be documented`;