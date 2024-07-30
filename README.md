# Autonomous Trading Agent

This project implements an autonomous trading agent using LangChain and Anthropic's Claude AI model. The agent can perform various trading-related tasks and provide real-time updates through a server-sent events (SSE) stream.

https://github.com/user-attachments/assets/9177d52a-b0fc-480c-9812-9e7862f94743

)

## Features

- Autonomous trading decision-making
- Real-time updates via SSE
- Integration with various tools for market analysis and token information
- Configurable system prompts
- Auto-restart mechanism with a 1-minute pause between cycles

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in a `.env` file:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ALCHEMY_API_KEY=your_alchemy_api_key
   ```

## Usage

1. Start the server: `npm start`
2. Connect to the SSE endpoint to receive real-time updates from the agent
3. Use the `stopAutonomousAgent()` function to halt the agent's execution

## Main Components

- `startAutonomousAgent()`: Initializes and runs the agent
- `stopAutonomousAgent()`: Stops the agent's execution
- Various tools for market analysis and token information

## Contributing

Contributions are welcome! Please submit a pull request or create an issue for any bugs or feature requests.

## License

[MIT License](LICENSE)
