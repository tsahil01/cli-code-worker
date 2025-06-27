import { ToolUnion } from "@anthropic-ai/sdk/resources/messages";

export const anthropicTools: ToolUnion[] = [{
    name: "run_command",
    description: "Execute a Linux command and return output.",
    input_schema: {
        type: "object",
        properties: {
            command: {
                type: "string",
                description: "The command to execute"
            }
        },
        required: ["command"]
    },
}, {
    name: "run_background_command",
    description: "Run a command in the background.",
    input_schema: {
        type: "object",
        properties: {
            command: {
                type: "string",
                description: "The command to run in background"
            },
            processId: {
                type: "string",
                description: "Unique identifier for the background process"
            }
        },
        required: ["command", "processId"]
    },

}, {
    name: "stop_process",
    description: "Stop a background process.",
    input_schema: {
        type: "object",
        properties: {
            processId: {
                type: "string",
                description: "The process ID to stop"
            }
        },
        required: ["processId"]
    }
}, {
    name: "is_process_running",
    description: "Check if a process is running.",
    input_schema: {
        type: "object",
        properties: {
            processId: {
                type: "string",
                description: "The process ID to check"
            }
        },
        required: ["processId"]
    },

}, {
    name: "check_current_directory",
    description: "Get the current directory.",
    input_schema: {
        type: "object",
        properties: {},
        required: []
    },

}, {
    name: "list_files",
    description: "List files in a directory.",
    input_schema: {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "The directory path to list files from"
            }
        },
        required: ["filePath"]
    },

}, {
    name: "read_file",
    description: "Read a file's content.",
    input_schema: {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "The file path to read"
            }
        },
        required: ["filePath"]
    },

}, {
    name: "write_file",
    description: "Write content to a file.",
    input_schema: {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "The file path to write to"
            },
            content: {
                type: "string",
                description: "The content to write to the file"
            }
        },
        required: ["filePath", "content"]
    }
}, {
    name: "open_file",
    description: "Open a file with the default application.",
    input_schema: {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "The file path to open"
            }
        },
        required: ["filePath"]
    },

}, {
    name: "open_browser",
    description: "Open a URL in the browser.",
    input_schema: {
        type: "object",
        properties: {
            url: {
                type: "string",
                description: "The URL to open in the browser"
            }
        },
        required: ["url"]
    },

}, {
    name: "grep_search",
    description: "Search for a term in files.",
    input_schema: {
        type: "object",
        properties: {
            searchTerm: {
                type: "string",
                description: "The term to search for"
            },
            filePath: {
                type: "string",
                description: "The file or directory path to search in"
            }
        },
        required: ["searchTerm", "filePath"]
    },

}, {
    name: "open_file_vscode",
    description: "Opens a file in the VSCode editor.",
    input_schema: {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "Path to the file to open"
            },
            options: {
                type: "object",
                description: "VSCode text editor options",
                properties: {
                    viewColumn: {
                        type: "number",
                        description: "The view column to open the document in"
                    },
                    preserveFocus: {
                        type: "boolean",
                        description: "Whether to preserve focus on the current editor"
                    },
                    preview: {
                        type: "boolean",
                        description: "Whether to open the document in preview mode"
                    }
                }
            }
        },
        required: ["filePath"]
    }
}, {
    name: "write_file_vscode",
    description: "Writes content to a file in the VSCode workspace.",
    input_schema: {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "Path to the file to write"
            },
            content: {
                type: "string",
                description: "Content to write to the file"
            }
        },
        required: ["filePath", "content"]
    }
}, {
    name: "delete_file",
    description: "Deletes a file from the workspace.",
    input_schema: {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "Path to the file to delete"
            }
        },
        required: ["filePath"]
    }
}, {
    name: "select_text",
    description: "Selects text in the active editor in VSCode.",
    input_schema: {
        type: "object",
        properties: {
            startLine: {
                type: "number",
                description: "Starting line number (1-based)"
            },
            startChar: {
                type: "number",
                description: "Starting character position (0-based)"
            },
            endLine: {
                type: "number",
                description: "Ending line number (1-based)"
            },
            endChar: {
                type: "number",
                description: "Ending character position (0-based)"
            }
        },
        required: ["startLine", "startChar", "endLine", "endChar"]
    }
}, {
    name: "show_notification",
    description: "Shows a notification in VSCode.",
    input_schema: {
        type: "object",
        properties: {
            message: {
                type: "string",
                description: "Message to display in the notification"
            },
            type: {
                type: "string",
                enum: ["info", "warning", "error"],
                description: "Type of notification to show",
                default: "info"
            }
        },
        required: ["message"]
    }
}, {
    name: "propose_change_vscode",
    description: "Proposes a code change with inline diff preview in VSCode.",
    input_schema: {
        type: "object",
        properties: {
            title: {
                type: "string",
                description: "Title of the change proposal"
            },
            description: {
                type: "string",
                description: "Description of the changes"
            },
            filePath: {
                type: "string",
                description: "Path to the file to be modified"
            },
            originalContent: {
                type: "string",
                description: "Original content being replaced"
            },
            proposedContent: {
                type: "string",
                description: "New content to replace with"
            },
            startLine: {
                type: "number",
                description: "Starting line number of the change (1-based)"
            },
            endLine: {
                type: "number",
                description: "Ending line number of the change (1-based)"
            },
            changes: {
                type: "array",
                description: "Optional array of multiple changes",
                items: {
                    type: "object",
                    properties: {
                        startLine: {
                            type: "number",
                            description: "Starting line number (1-based)"
                        },
                        endLine: {
                            type: "number",
                            description: "Ending line number (1-based)"
                        },
                        proposedContent: {
                            type: "string",
                            description: "New content for this change"
                        }
                    },
                    required: ["startLine", "endLine", "proposedContent"]
                }
            }
        },
        required: ["title", "description", "filePath"]
    }
}, {
    name: "get_active_file",
    description: "Gets information about the currently active file in the editor.",
    input_schema: {
        type: "object",
        properties: {},
        required: []
    }
}, {
    name: "get_open_tabs",
    description: "Gets information about all open tabs in the editor.",
    input_schema: {
        type: "object",
        properties: {},
        required: []
    }
}, {
    name: "get_text_selection",
    description: "Gets information about the current text selection in the active editor.",
    input_schema: {
        type: "object",
        properties: {},
        required: []
    }
}, {
    name: "get_diffs",
    description: "Gets information about latest changes in the workspace.",
    input_schema: {
        type: "object",
        properties: {},
        required: []
    }
}, {
    name: "get_diagnostics",
    description: "Gets diagnostic information (errors, warnings, etc.) for files in the workspace.",
    input_schema: {
        type: "object",
        properties: {},
        required: []
    }
}];
