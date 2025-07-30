import { Plugin, Editor, MarkdownView, Menu, Notice, debounce } from 'obsidian';
import { SynapseSettings, DEFAULT_SETTINGS } from './settings';
import { SynapseSettingsTab } from './ui/SettingsTab';
import { OllamaClient } from './ollama';
import { SynapseCommands } from './commands';

export default class SynapsePlugin extends Plugin {
    settings: SynapseSettings;
    ollama: OllamaClient;
    commands: SynapseCommands;
    debouncedSuggestion: any;

    async onload() {
        await this.loadSettings();

        // Initialize Ollama client and commands
        this.ollama = new OllamaClient(this.settings.ollamaUrl, this.settings.ollamaModel);
        this.commands = new SynapseCommands(this.app, this.ollama, this.settings);

        // Set up debounced suggestion
        this.debouncedSuggestion = debounce(
            (editor: Editor) => this.commands.generateLiveSuggestion(editor),
            this.settings.suggestionDelay
        );

        // Add settings tab
        this.addSettingTab(new SynapseSettingsTab(this.app, this));

        // Register commands
        this.addCommand({
            id: 'explain-and-link',
            name: 'Explain & Link Selected Text',
            editorCallback: (editor: Editor) => {
                const selectedText = editor.getSelection();
                this.commands.explainAndLink(editor, selectedText);
            },
        });

        this.addCommand({
            id: 'summarize-note',
            name: 'Summarize Current Note',
            editorCallback: (editor: Editor) => {
                const content = editor.getValue();
                this.commands.summarizeNote(editor, content);
            },
        });

        this.addCommand({
            id: 'create-flashcards',
            name: 'Create Flashcards from Selection',
            editorCallback: (editor: Editor) => {
                const selectedText = editor.getSelection();
                this.commands.createFlashcards(editor, selectedText);
            },
        });
        
        // Add new chat commands
        this.addCommand({
            id: 'start-chat',
            name: 'Start New Chat Session',
            editorCallback: (editor: Editor) => {
                this.commands.startChatSession(editor);
            },
        });
        
        this.addCommand({
            id: 'send-chat-message',
            name: 'Send Chat Message',
            editorCallback: (editor: Editor) => {
                this.commands.sendChatMessage(editor);
            },
        });

        // Add context menu items
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
                const selectedText = editor.getSelection();
                
                if (selectedText) {
                    menu.addItem((item) => {
                        item
                            .setTitle('🧠 Explain & Link')
                            .setIcon('brain-circuit')
                            .onClick(async () => {
                                await this.commands.explainAndLink(editor, selectedText);
                            });
                    });

                    menu.addItem((item) => {
                        item
                            .setTitle('🎴 Create Flashcards')
                            .setIcon('card-stack')
                            .onClick(async () => {
                                await this.commands.createFlashcards(editor, selectedText);
                            });
                    });
                }

                menu.addItem((item) => {
                    item
                        .setTitle('📝 Summarize Note')
                        .setIcon('list-checks')
                        .onClick(async () => {
                            const content = editor.getValue();
                            await this.commands.summarizeNote(editor, content);
                        });
                });
                
                // Add chat option
                const fileName = this.app.workspace.getActiveFile()?.basename || '';
                if (fileName.startsWith('Chat-')) {
                    menu.addItem((item) => {
                        item
                            .setTitle('💬 Send Chat Message')
                            .setIcon('message-square')
                            .onClick(async () => {
                                await this.commands.sendChatMessage(editor);
                            });
                    });
                } else {
                    menu.addItem((item) => {
                        item
                            .setTitle('💬 Start Chat Session')
                            .setIcon('message-circle')
                            .onClick(async () => {
                                await this.commands.startChatSession(editor);
                            });
                    });
                }
            })
        );
        
        // Register editor event for live suggestions
        if (this.settings.enableLiveSuggestions) {
            this.registerEvent(
                this.app.workspace.on('editor-change', (editor: Editor) => {
                    this.debouncedSuggestion(editor);
                })
            );
        }

        // Check Ollama availability on startup
        this.checkOllamaConnection();

        console.log('Synapse plugin loaded');
    }

    onunload() {
        console.log('Synapse plugin unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Update commands with new settings
        this.commands.updateSettings(this.settings);
        
        // Re-initialize debounced suggestion with new delay
        this.debouncedSuggestion = debounce(
            (editor: Editor) => this.commands.generateLiveSuggestion(editor),
            this.settings.suggestionDelay
        );
        
        // Update event listeners for live suggestions
        if (this.settings.enableLiveSuggestions) {
            this.registerEvent(
                this.app.workspace.on('editor-change', (editor: Editor) => {
                    this.debouncedSuggestion(editor);
                })
            );
        }
    }

    private async checkOllamaConnection() {
        const isAvailable = await this.ollama.isAvailable();
        
        if (!isAvailable) {
            new Notice(
                'Synapse: Cannot connect to Ollama. Please make sure Ollama is running on ' + 
                this.settings.ollamaUrl, 
                8000
            );
        } else {
            new Notice('Synapse: Connected to Ollama successfully', 3000);
        }
    }
}