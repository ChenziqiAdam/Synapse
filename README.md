# Synapse - Personal Knowledge Engine

Transform your learning from passive consumption to active knowledge building with local AI integration.

## Features

- **Explain & Link**: Select any text to generate detailed explanations as linked notes
- **Summarize Note**: Automatically create concise summaries of your notes  
- **Create Flashcards**: Generate study flashcards from selected content
- **Interactive Chat**: Have conversations with AI inside your notes
- **Live Suggestions**: Get writing suggestions as you type
- **Local AI**: Works entirely offline using Ollama
- **Knowledge Graph**: Leverage Obsidian's graph view to visualize connections
- **Organized Folders**: Keep your generated content neatly organized
- **Automatic Tagging**: Add consistent tags to all generated notes

## Installation

1. Install [Ollama](https://ollama.ai) on your system
2. Pull a compatible model: `ollama pull gemma3n:e2b`
3. Install this plugin in Obsidian:
   - Enable Community Plugins
   - Search for "Synapse" or install manually
4. Configure the plugin in Settings → Synapse

## Usage

### Commands
- **Ctrl/Cmd + P** → "Synapse: Explain & Link Selected Text"
- **Ctrl/Cmd + P** → "Synapse: Summarize Current Note"  
- **Ctrl/Cmd + P** → "Synapse: Create Flashcards from Selection"
- **Ctrl/Cmd + P** → "Synapse: Start New Chat Session"
- **Ctrl/Cmd + P** → "Synapse: Send Chat Message"
- **Ctrl/Cmd + P** → "Synapse: Toggle Live Suggestions"

### Context Menu
- Right-click selected text for quick access to Synapse features

### Chat Interface
1. Start a new chat session using the command
2. Type your message after the ">" prompt
3. Press Enter or use "Send Chat Message" command
4. View AI responses right in your notes

### Live Suggestions
1. Enable Live Suggestions in the settings
2. As you type, Synapse will analyze your text and offer word suggestions
3. Accept suggestions with one click or continue typing to ignore them

## Configuration

Go to Settings → Synapse to configure:
- Ollama URL (default: http://localhost:11434)
- AI Model (default: gemma3n:e2b)
- Folder paths for organized content
- Summary placement and YAML formatting options
- Live suggestion settings
- Response length limits
- Auto-tagging settings for consistent organization

## Folder Organization

- **Explanations Folder**: Where explanation notes are stored
- **Flashcards Folder**: Where flashcard collections are stored
- **Chats Folder**: Where chat sessions are saved

## Requirements

- [Ollama](https://ollama.ai) installed and running
- Compatible AI model (phi3:mini, gemma3n:e2b, mistral, etc.)
- Obsidian v0.15.0 or higher

## Recommended Models

- **phi3:mini** - Fast, efficient, good for explanations
- **gemma3n:e2b** - High quality responses

## Troubleshooting

1. **Cannot connect to Ollama**: Ensure Ollama is running (`ollama serve`)
2. **Model not found**: Pull the model first (`ollama pull gemma3n:e2b`)
3. **Slow responses**: Try a smaller model like gemma3n:e2b
4. **Folders not creating**: Check folder path is valid and you have write permissions
5. **Live suggestions not appearing**: Check if the feature is enabled and adjust the delay setting

## Development

```bash
npm install
npm run dev
```

## License

MIT License
