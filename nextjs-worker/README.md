# CLI Code Worker - Next.js API

A powerful worker machine which handles LLM interaction with the CLI, built with Next.js for optimal streaming performance.

## Features

- **Multi-Provider Support**: Anthropic, OpenAI, and Gemini
- **Streaming Responses**: Real-time streaming with Server-Sent Events
- **Tool Calls**: Support for function calling across all providers
- **Thinking Capabilities**: Advanced reasoning with thinking blocks
- **Authentication**: JWT-based user verification
- **Type Safety**: Full TypeScript support

## API Endpoints

### Health Check
- `GET /api` - Basic health check

### User Management
- `GET /api/user` - Get user information (requires authentication)

### Models
- `GET /api/models` - Get available models
- `GET /api/models/available` - Alternative endpoint for available models

### Chat Streaming
- `POST /api/chat/stream` - Stream chat completions

## Environment Variables

Create a `.env.local` file with:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## Migration from Express

This Next.js version provides the same functionality as the original Express app but with:

- Better streaming performance with Next.js App Router
- Optimized for Vercel deployment
- Improved type safety
- Better error handling
- Edge runtime compatibility
