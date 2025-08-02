export const TOOL_USAGE_ADDON = `
## Tool Usage Guidelines

**Long-Running Process Management:**
- Use \`run_background_command\` for any command that runs continuously (npm run dev, servers, watchers, etc.)
- Use \`run_command\` only for quick, one-time operations that return immediately
- Always provide a meaningful \`processId\` for background commands to track them
- Use \`is_process_running\` to verify background processes are active
- Use \`stop_process\` to clean up background processes when done

**File Operations Best Practices:**
- Use \`write_file\` as the primary file writing tool for all file operations
- Use \`open_file_vscode\` for opening files in the editor context
- Use \`delete_file\` with caution - always verify file existence first with \`list_files\` or \`read_file\`
- Always validate file paths before operations
- Create backups before destructive operations

**Context Gathering Sequence:**
- Always start with \`check_current_directory\` to understand the environment
- Use \`list_files\` to explore project structure before making changes
- Use \`get_active_file\` when users refer to "this" or current context
- Use \`get_open_tabs\` to understand what files the user is working with
- Use \`get_diagnostics\` to check for errors before and after making changes

**Search and Navigation (Use Extensively):**
- ALWAYS use \`grep_search\` for finding ANY text, patterns, functions, variables, or code across the codebase
- Use \`grep_search\` when in doubt about where something is located - search first, then act
- Use \`grep_search\` extensively for finding files by name, partial names, or extensions by searching for filenames
- Use \`grep_search\` for semantic understanding of code structure and relationships by searching for class names, function names, and patterns
- When confused about project structure, use \`grep_search\` extensively with different search terms to understand the codebase
- Search before making assumptions about code location or structure
- Use \`grep_search\` with multiple patterns to thoroughly explore codebases
- CRITICAL: \`grep_search\` is your primary discovery tool - use it liberally for any code exploration

**IDE Integration Priority:**
- Use \`open_file_vscode\` for opening files in the editor context
- Use \`get_diagnostics\` to check for errors before and after making changes
- Use \`get_diffs\` to understand recent changes in the workspace
- Use \`propose_change_vscode\` for complex code changes that need review

**User Experience Tools:**
- Use \`select_text\` to highlight relevant code sections for users

**Error Handling and Validation:**
- Always verify command success by checking output/exit codes
- Check file permissions and existence before reading/writing
- Validate commands before execution

**Tool Combination Patterns (Use Extensively):**
- Combine \`list_files\` + \`grep_search\` for targeted code exploration and understanding project structure
- Use \`grep_search\` multiple times with different patterns to thoroughly search codebases
- Combine \`get_active_file\` + \`get_text_selection\` for context-aware assistance
- Use \`check_current_directory\` + \`list_files\` + \`grep_search\` for comprehensive project analysis
- Combine \`run_command\` + \`read_file\` for configuration validation
- Use \`grep_search\` + \`read_file\` to find and then examine specific code sections
- Use \`list_files\` + \`grep_search\` extensively for thorough codebase exploration
- Use \`get_diagnostics\` + \`grep_search\` to find and understand error sources
- Combine multiple \`grep_search\` calls when confused: search for filenames → search for functions → search for patterns
- Use \`list_files\` + \`grep_search\` (multiple times) + \`read_file\` in sequence for comprehensive understanding
- ALWAYS use \`grep_search\` as your first exploration step before making any assumptions

**Safety and Validation:**
- Always verify command success by checking output/exit codes
- Check file permissions and existence before reading/writing
- Validate commands before execution
- Create backups when performing destructive operations`; 