import { ToolUnion } from "@anthropic-ai/sdk/resources/messages";
import { FunctionDeclaration, Type } from "@google/genai";
import { ChatCompletionTool, } from "openai/resources/index";

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
    description: "Run long running process/command. This command will run in the background and return a process ID.",
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
    "name": "propose_change_vscode",
    "description": "Proposes a code change with inline diff preview in VSCode. Uses pure content-based matching - simply provide the exact text to find and replace.",
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Title of the change proposal (shown in diff dialog)"
            },
            "filePath": {
                "type": "string",
                "description": "Path to the file to be modified"
            },
            "changes": {
                "type": "array",
                "description": "Array of content-based changes to apply",
                "items": {
                    "type": "object",
                    "properties": {
                        "originalContent": {
                            "type": "string",
                            "description": "Exact text content to find and replace. Include enough context to make it unique if the same text appears multiple times."
                        },
                        "proposedContent": {
                            "type": "string",
                            "description": "New content to replace the original content with"
                        },
                        "description": {
                            "type": "string",
                            "description": "Optional description of this specific change"
                        }
                    },
                    "required": ["originalContent", "proposedContent"]
                },
                "minItems": 1
            }
        },
        "required": ["title", "filePath", "changes"]
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

export const geminiTools: FunctionDeclaration[] = [{
    name: "run_command",
    description: "Execute a Linux command and return output.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            command: {
                type: Type.STRING,
                description: "The command to execute"
            }
        },
        required: ["command"]
    }
}, {
    name: "run_background_command",
    description: "Run long running process/command. This command will run in the background and return a process ID.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            command: {
                type: Type.STRING,
                description: "The command to run in background"
            },
            processId: {
                type: Type.STRING,
                description: "Unique identifier for the background process"
            }
        },
        required: ["command", "processId"]
    }
}, {
    name: "stop_process",
    description: "Stop a background process.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            processId: {
                type: Type.STRING,
                description: "The process ID to stop"
            }
        },
        required: ["processId"]
    }
}, {
    name: "is_process_running",
    description: "Check if a process is running.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            processId: {
                type: Type.STRING,
                description: "The process ID to check"
            }
        },
        required: ["processId"]
    }
}, {
    name: "check_current_directory",
    description: "Get the current directory.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
        required: []
    }
}, {
    name: "list_files",
    description: "List files in a directory.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filePath: {
                type: Type.STRING,
                description: "The directory path to list files from"
            }
        },
        required: ["filePath"]
    }
}, {
    name: "read_file",
    description: "Read a file's content.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filePath: {
                type: Type.STRING,
                description: "The file path to read"
            }
        },
        required: ["filePath"]
    }
}, {
    name: "write_file",
    description: "Write content to a file.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filePath: {
                type: Type.STRING,
                description: "The file path to write to"
            },
            content: {
                type: Type.STRING,
                description: "The content to write to the file"
            }
        },
        required: ["filePath", "content"]
    }
}, {
    name: "open_file",
    description: "Open a file with the default application.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filePath: {
                type: Type.STRING,
                description: "The file path to open"
            }
        },
        required: ["filePath"]
    }
}, {
    name: "open_browser",
    description: "Open a URL in the browser.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            url: {
                type: Type.STRING,
                description: "The URL to open in the browser"
            }
        },
        required: ["url"]
    }
}, {
    name: "grep_search",
    description: "Search for a term in files.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            searchTerm: {
                type: Type.STRING,
                description: "The term to search for"
            },
            filePath: {
                type: Type.STRING,
                description: "The file or directory path to search in"
            }
        },
        required: ["searchTerm", "filePath"]
    }
}, {
    name: "open_file_vscode",
    description: "Opens a file in the VSCode editor.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filePath: {
                type: Type.STRING,
                description: "Path to the file to open"
            },
            options: {
                type: Type.OBJECT,
                description: "VSCode text editor options",
                properties: {
                    viewColumn: {
                        type: Type.NUMBER,
                        description: "The view column to open the document in"
                    },
                    preserveFocus: {
                        type: Type.BOOLEAN,
                        description: "Whether to preserve focus on the current editor"
                    },
                    preview: {
                        type: Type.BOOLEAN,
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
    parameters: {
        type: Type.OBJECT,
        properties: {
            filePath: {
                type: Type.STRING,
                description: "Path to the file to write"
            },
            content: {
                type: Type.STRING,
                description: "Content to write to the file"
            }
        },
        required: ["filePath", "content"]
    }
}, {
    name: "delete_file",
    description: "Deletes a file from the workspace.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filePath: {
                type: Type.STRING,
                description: "Path to the file to delete"
            }
        },
        required: ["filePath"]
    }
}, {
    name: "select_text",
    description: "Selects text in the active editor in VSCode.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            startLine: {
                type: Type.NUMBER,
                description: "Starting line number (1-based)"
            },
            startChar: {
                type: Type.NUMBER,
                description: "Starting character position (0-based)"
            },
            endLine: {
                type: Type.NUMBER,
                description: "Ending line number (1-based)"
            },
            endChar: {
                type: Type.NUMBER,
                description: "Ending character position (0-based)"
            }
        },
        required: ["startLine", "startChar", "endLine", "endChar"]
    }
}, {
    name: "show_notification",
    description: "Shows a notification in VSCode.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            message: {
                type: Type.STRING,
                description: "Message to display in the notification"
            },
            type: {
                type: Type.STRING,
                enum: ["info", "warning", "error"],
                description: "Type of notification to show"
            }
        },
        required: ["message"]
    }
}, {
    name: "propose_change_vscode",
    description: "Proposes a code change with inline diff preview in VSCode. Uses pure content-based matching - simply provide the exact text to find and replace.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: "Title of the change proposal (shown in diff dialog)"
            },
            filePath: {
                type: Type.STRING,
                description: "Path to the file to be modified"
            },
            changes: {
                type: Type.ARRAY,
                description: "Array of content-based changes to apply",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        originalContent: {
                            type: Type.STRING,
                            description: "Exact text content to find and replace. Include enough context to make it unique if the same text appears multiple times."
                        },
                        proposedContent: {
                            type: Type.STRING,
                            description: "New content to replace the original content with"
                        },
                        description: {
                            type: Type.STRING,
                            description: "Optional description of this specific change"
                        }
                    },
                    required: ["originalContent", "proposedContent"]
                }
            }
        },
        required: ["title", "filePath", "changes"]
    }
}, {
    name: "get_active_file",
    description: "Gets information about the currently active file in the editor.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
        required: []
    }
}, {
    name: "get_open_tabs",
    description: "Gets information about all open tabs in the editor.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
        required: []
    }
}, {
    name: "get_text_selection",
    description: "Gets information about the current text selection in the active editor.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
        required: []
    }
}, {
    name: "get_diffs",
    description: "Gets information about latest changes in the workspace.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
        required: []
    }
}, {
    name: "get_diagnostics",
    description: "Gets diagnostic information (errors, warnings, etc.) for files in the workspace.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
        required: []
    }
}];

export const openaiTools: ChatCompletionTool[] = [{
    type: "function",
    function: {
        name: "run_command",
        description: "Execute a Linux command and return output.",
        parameters: {
            type: "object",
            properties: {
                command: {
                    type: "string",
                    description: "The command to execute"
                }
            },
            required: ["command"]
        }
    }
}, {
    type: "function",
    function: {
        name: "run_background_command",
        description: "Run long running process/command. This command will run in the background and return a process ID.",
        parameters: {
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
        }
    }
}, {
    type: "function",
    function: {
        name: "stop_process",
        description: "Stop a background process.",
        parameters: {
            type: "object",
            properties: {
                processId: {
                    type: "string",
                    description: "The process ID to stop"
                }
            },
            required: ["processId"]
        }
    }
}, {
    type: "function",
    function: {
        name: "is_process_running",
        description: "Check if a process is running.",
        parameters: {
            type: "object",
            properties: {
                processId: {
                    type: "string",
                    description: "The process ID to check"
                }
            },
            required: ["processId"]
        }
    }
}, {
    type: "function",
    function: {
        name: "check_current_directory",
        description: "Get the current directory.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    }
}, {
    type: "function",
    function: {
        name: "list_files",
        description: "List files in a directory.",
        parameters: {
            type: "object",
            properties: {
                filePath: {
                    type: "string",
                    description: "The directory path to list files from"
                }
            },
            required: ["filePath"]
        }
    }
}, {
    type: "function",
    function: {
        name: "read_file",
        description: "Read a file's content.",
        parameters: {
            type: "object",
            properties: {
                filePath: {
                    type: "string",
                    description: "The file path to read"
                }
            },
            required: ["filePath"]
        }
    }
}, {
    type: "function",
    function: {
        name: "write_file",
        description: "Write content to a file.",
        parameters: {
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
    }
}, {
    type: "function",
    function: {
        name: "open_file",
        description: "Open a file with the default application.",
        parameters: {
            type: "object",
            properties: {
                filePath: {
                    type: "string",
                    description: "The file path to open"
                }
            },
            required: ["filePath"]
        }
    }
}, {
    type: "function",
    function: {
        name: "open_browser",
        description: "Open a URL in the browser.",
        parameters: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description: "The URL to open in the browser"
                }
            },
            required: ["url"]
        }
    }
}, {
    type: "function",
    function: {
        name: "grep_search",
        description: "Search for a term in files.",
        parameters: {
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
        }
    }
}, {
    type: "function",
    function: {
        name: "open_file_vscode",
        description: "Opens a file in the VSCode editor.",
        parameters: {
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
    }
}, {
    type: "function",
    function: {
        name: "write_file_vscode",
        description: "Writes content to a file in the VSCode workspace.",
        parameters: {
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
    }
}, {
    type: "function",
    function: {
        name: "delete_file",
        description: "Deletes a file from the workspace.",
        parameters: {
            type: "object",
            properties: {
                filePath: {
                    type: "string",
                    description: "Path to the file to delete"
                }
            },
            required: ["filePath"]
        }
    }
}, {
    type: "function",
    function: {
        name: "select_text",
        description: "Selects text in the active editor in VSCode.",
        parameters: {
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
    }
}, {
    type: "function",
    function: {
        name: "show_notification",
        description: "Shows a notification in VSCode.",
        parameters: {
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
    }
}, {
    type: "function",
    function: {
        name: "propose_change_vscode",
        description: "Proposes a code change with inline diff preview in VSCode. Uses pure content-based matching - simply provide the exact text to find and replace.",
        parameters: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "Title of the change proposal (shown in diff dialog)"
                },
                filePath: {
                    type: "string",
                    description: "Path to the file to be modified"
                },
                changes: {
                    type: "array",
                    description: "Array of content-based changes to apply",
                    items: {
                        type: "object",
                        properties: {
                            originalContent: {
                                type: "string",
                                description: "Exact text content to find and replace. Include enough context to make it unique if the same text appears multiple times."
                            },
                            proposedContent: {
                                type: "string",
                                description: "New content to replace the original content with"
                            },
                            description: {
                                type: "string",
                                description: "Optional description of this specific change"
                            }
                        },
                        required: ["originalContent", "proposedContent"]
                    },
                    minItems: 1
                }
            },
            required: ["title", "filePath", "changes"]
        }
    }
}, {
    type: "function",
    function: {
        name: "get_active_file",
        description: "Gets information about the currently active file in the editor.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    }
}, {
    type: "function",
    function: {
        name: "get_open_tabs",
        description: "Gets information about all open tabs in the editor.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    }
}, {
    type: "function",
    function: {
        name: "get_text_selection",
        description: "Gets information about the current text selection in the active editor.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    }
}, {
    type: "function",
    function: {
        name: "get_diffs",
        description: "Gets information about latest changes in the workspace.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    }
}, {
    type: "function",
    function: {
        name: "get_diagnostics",
        description: "Gets diagnostic information (errors, warnings, etc.) for files in the workspace.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    }
}];