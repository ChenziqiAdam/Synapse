# Synapse - Personal Knowledge Engine

Transform your learning from passive consumption to active knowledge building with local AI integration.

## Features

- **Explain & Link**: Select any text to generate detailed explanations as linked notes
- **Summarize Note**: Automatically create concise summaries of your notes  
- **Create Flashcards**: Generate study flashcards from selected content
- **Local AI**: Works entirely offline using Ollama
- **Knowledge Graph**: Leverage Obsidian's graph view to visualize connections

## Installation

1. Install [Ollama](https://ollama.ai) on your system
2. Pull a compatible model: `ollama pull phi3:mini`
3. Install this plugin in Obsidian:
   - Enable Community Plugins
   - Search for "Synapse" or install manually
4. Configure the plugin in Settings → Synapse

## Usage

### Commands
- **Ctrl/Cmd + P** → "Synapse: Explain & Link Selected Text"
- **Ctrl/Cmd + P** → "Synapse: Summarize Current Note"  
- **Ctrl/Cmd + P** → "Synapse: Create Flashcards from Selection"

### Context Menu
- Right-click selected text for quick access to Synapse features

## Configuration

Go to Settings → Synapse to configure:
- Ollama URL (default: http://localhost:11434)
- AI Model (default: phi3:mini)
- Summary placement and formatting options
- Response length limits

## Requirements

- [Ollama](https://ollama.ai) installed and running
- Compatible AI model (phi3:mini, llama2, mistral, etc.)
- Obsidian v0.15.0 or higher

## Recommended Models

- **phi3:mini** - Fast, efficient, good for explanations
- **llama2** - Balanced performance and quality
- **mistral** - High quality responses

## Troubleshooting

1. **Cannot connect to Ollama**: Ensure Ollama is running (`ollama serve`)
2. **Model not found**: Pull the model first (`ollama pull phi3:mini`)
3. **Slow responses**: Try a smaller model like phi3:mini

## Development

```bash
npm install
npm run dev
```

## License

MIT License
