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
    name: "edit_file",
    description: "Edit a file using a patch.",
    input_schema: {
        type: "object",
        properties: {
            filePath: {
                type: "string",
                description: "The file path to edit"
            },
            content: {
                type: "string",
                description: "The patch content to apply"
            }
        },
        required: ["filePath", "content"]
    },
    
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
    
}];
