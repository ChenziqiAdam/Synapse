import { App, PluginSettingTab, Setting, TextAreaComponent, DropdownComponent, TFile, ButtonComponent } from 'obsidian';
import SynapsePlugin from '../main';
import { OllamaClient } from '../ollama';

export class SynapseSettingsTab extends PluginSettingTab {
    plugin: SynapsePlugin;

    constructor(app: App, plugin: SynapsePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('synapse-settings');

        // Create tabs for better organization
        const tabContainer = containerEl.createDiv('synapse-settings-tabs');
        const tabContent = containerEl.createDiv('synapse-settings-content');
        
        // Create tab buttons
        const generalTab = tabContainer.createDiv('synapse-tab');
        generalTab.setText('General');
        generalTab.addClass('active');
        
        const promptsTab = tabContainer.createDiv('synapse-tab');
        promptsTab.setText('AI Prompts');
        
        const templatesTab = tabContainer.createDiv('synapse-tab');
        templatesTab.setText('Templates');
        
        const advancedTab = tabContainer.createDiv('synapse-tab');
        advancedTab.setText('Advanced');
        
        // Create content sections
        const generalContent = tabContent.createDiv('synapse-tab-content');
        generalContent.addClass('active');
        
        const promptsContent = tabContent.createDiv('synapse-tab-content');
        promptsContent.style.display = 'none';
        
        const templatesContent = tabContent.createDiv('synapse-tab-content');
        templatesContent.style.display = 'none';
        
        const advancedContent = tabContent.createDiv('synapse-tab-content');
        advancedContent.style.display = 'none';
        
        // Set up tab switching
        const tabs = [generalTab, promptsTab, templatesTab, advancedTab];
        const contents = [generalContent, promptsContent, templatesContent, advancedContent];
        
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.removeClass('active'));
                contents.forEach(c => c.style.display = 'none');
                
                tab.addClass('active');
                contents[index].style.display = 'block';
            });
        });

        // GENERAL SETTINGS

        // Ollama Configuration
        generalContent.createEl('h3', { text: 'Ollama' });

        new Setting(generalContent)
            .setName('Ollama URL')
            .setDesc('URL where Ollama is running (default: http://localhost:11434)')
            .addText(text => text
                .setPlaceholder('http://localhost:11434')
                .setValue(this.plugin.settings.ollamaUrl)
                .onChange(async (value) => {
                    this.plugin.settings.ollamaUrl = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(generalContent)
            .setName('Model')
            .setDesc('Ollama model to use (e.g., phi3:mini, gemma3n:e2b, mistral)')
            .addText(text => text
                .setPlaceholder('phi3:mini')
                .setValue(this.plugin.settings.ollamaModel)
                .onChange(async (value) => {
                    this.plugin.settings.ollamaModel = value;
                    await this.plugin.saveSettings();
                }));

        // Available models dropdown
        const modelContainer = generalContent.createDiv('synapse-model-selector');
        const modelSetting = new Setting(modelContainer)
            .setName('Select Available Model')
            .setDesc('Choose from models available in your Ollama installation');
        
        let modelDropdown: DropdownComponent;
        modelSetting.addDropdown(dropdown => {
            modelDropdown = dropdown;
            dropdown.addOption('', 'Loading models...');
            dropdown.setValue('');
            dropdown.onChange(async (value) => {
                if (value) {
                    this.plugin.settings.ollamaModel = value;
                    await this.plugin.saveSettings();
                }
            });
        });
        
        // Load available models
        this.loadAvailableModels(modelDropdown);

        // Test connection button
        new Setting(generalContent)
            .setName('Test Connection')
            .setDesc('Test connection to Ollama')
            .addButton(button => {
                button.setButtonText('Test');
                button.setCta();
                // 修复：分开调用方法而不是链式调用
                button.buttonEl.addClass('synapse-test-button');
                button.onClick(async () => {
                    const client = new OllamaClient(this.plugin.settings.ollamaUrl, this.plugin.settings.ollamaModel);
                    const isAvailable = await client.isAvailable();
                    
                    if (isAvailable) {
                        button.setButtonText('✓ Connected');
                        button.buttonEl.style.backgroundColor = '#4caf50';
                        setTimeout(() => {
                            button.setButtonText('Test');
                            button.buttonEl.style.backgroundColor = '';
                        }, 2000);
                    } else {
                        button.setButtonText('✗ Failed');
                        button.buttonEl.style.backgroundColor = '#f44336';
                        setTimeout(() => {
                            button.setButtonText('Test');
                            button.buttonEl.style.backgroundColor = '';
                        }, 2000);
                    }
                });
            });

        // Features
        generalContent.createEl('h3', { text: 'Features' });

        new Setting(generalContent)
            .setName('Auto-linking')
            .setDesc('Automatically create links when using "Explain & Link"')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoLinkEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.autoLinkEnabled = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(generalContent)
            .setName('Summary Location')
            .setDesc('Where to place summaries in notes')
            .addDropdown(dropdown => dropdown
                .addOption('top', 'Top of note')
                .addOption('bottom', 'Bottom of note')
                .setValue(this.plugin.settings.summaryLocation)
                .onChange(async (value: 'top' | 'bottom') => {
                    this.plugin.settings.summaryLocation = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(generalContent)
            .setName('Use YAML for Summaries')
            .setDesc('Add summaries to note frontmatter as YAML')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useSummaryYaml)
                .onChange(async (value) => {
                    this.plugin.settings.useSummaryYaml = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(generalContent)
            .setName('Max Response Length')
            .setDesc('Maximum length for AI responses (characters)')
            .addSlider(slider => slider
                .setLimits(500, 3000, 100)
                .setValue(this.plugin.settings.maxResponseLength)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxResponseLength = value;
                    await this.plugin.saveSettings();
                }));
                
        // Folder organization
        generalContent.createEl('h3', { text: 'Folder Organization' });
        
        new Setting(generalContent)
            .setName('Explanations Folder')
            .setDesc('Folder for explanation notes (empty for vault root)')
            .addText(text => text
                .setPlaceholder('Explanations')
                .setValue(this.plugin.settings.explanationFolder)
                .onChange(async (value) => {
                    this.plugin.settings.explanationFolder = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(generalContent)
            .setName('Flashcards Folder')
            .setDesc('Folder for flashcard notes (empty for vault root)')
            .addText(text => text
                .setPlaceholder('Flashcards')
                .setValue(this.plugin.settings.flashcardFolder)
                .onChange(async (value) => {
                    this.plugin.settings.flashcardFolder = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(generalContent)
            .setName('Chat Folder')
            .setDesc('Folder for chat session notes (empty for vault root)')
            .addText(text => text
                .setPlaceholder('Chats')
                .setValue(this.plugin.settings.chatFolder)
                .onChange(async (value) => {
                    this.plugin.settings.chatFolder = value;
                    await this.plugin.saveSettings();
                }));
        
        // Add tag settings to general content
        generalContent.createEl('h3', { text: 'Note Tagging' });
        
        new Setting(generalContent)
            .setName('Add Tags to Notes')
            .setDesc('Automatically add tags to all notes created by Synapse')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addSynapseTag)
                .onChange(async (value) => {
                    this.plugin.settings.addSynapseTag = value;
                    await this.plugin.saveSettings();
                    
                    // Update visibility of tag input based on toggle state
                    tagInput.setDisabled(!value);
                }));
        
        // Add tag input setting
        let tagInput: Setting;
        tagInput = new Setting(generalContent)
            .setName('Tags')
            .setDesc('Tags to add to notes (comma separated, # optional)')
            .addText(text => text
                .setPlaceholder('synapse, ai-generated')
                .setValue(this.plugin.settings.synapseTag)
                .onChange(async (value) => {
                    this.plugin.settings.synapseTag = value;
                    await this.plugin.saveSettings();
                }))
            .setDisabled(!this.plugin.settings.addSynapseTag);
            
        // PROMPTS SETTINGS
        promptsContent.createEl('p', { 
            text: 'Customize the system prompts used for different features. You can use variables like {{maxResponseLength}}, {{date}}, and {{model}}.'
        });

        // Global system prompt
        promptsContent.createEl('h3', { text: 'Global System Prompt' });
        
        const globalPromptSetting = new Setting(promptsContent)
            .setName('Global System Prompt')
            .setDesc('Default system prompt used when no specific prompt is provided');
        
        let globalPromptArea: TextAreaComponent;
        globalPromptSetting.addTextArea(textarea => {
            globalPromptArea = textarea;
            textarea
                .setValue(this.plugin.settings.globalSystemPrompt)
                .setPlaceholder('You are a helpful assistant...')
                .onChange(async (value) => {
                    this.plugin.settings.globalSystemPrompt = value;
                    await this.plugin.saveSettings();
                });
            
            textarea.inputEl.rows = 4;
            textarea.inputEl.cols = 50;
        });

        // Explanation system prompt
        promptsContent.createEl('h3', { text: 'Explanation Prompt' });
        
        const explanationPromptSetting = new Setting(promptsContent)
            .setName('Explanation System Prompt')
            .setDesc('System prompt used for generating explanations');
        
        let explanationPromptArea: TextAreaComponent;
        explanationPromptSetting.addTextArea(textarea => {
            explanationPromptArea = textarea;
            textarea
                .setValue(this.plugin.settings.explanationSystemPrompt)
                .setPlaceholder('Create a clear, concise explanation...')
                .onChange(async (value) => {
                    this.plugin.settings.explanationSystemPrompt = value;
                    await this.plugin.saveSettings();
                });
            
            textarea.inputEl.rows = 6;
            textarea.inputEl.cols = 50;
        });

        // Summary system prompt
        promptsContent.createEl('h3', { text: 'Summary Prompt' });
        
        const summaryPromptSetting = new Setting(promptsContent)
            .setName('Summary System Prompt')
            .setDesc('System prompt used for generating summaries');
        
        let summaryPromptArea: TextAreaComponent;
        summaryPromptSetting.addTextArea(textarea => {
            summaryPromptArea = textarea;
            textarea
                .setValue(this.plugin.settings.summarySystemPrompt)
                .setPlaceholder('Create a bullet-point summary...')
                .onChange(async (value) => {
                    this.plugin.settings.summarySystemPrompt = value;
                    await this.plugin.saveSettings();
                });
            
            textarea.inputEl.rows = 4;
            textarea.inputEl.cols = 50;
        });

        // Flashcard system prompt
        promptsContent.createEl('h3', { text: 'Flashcard Prompt' });
        
        const flashcardPromptSetting = new Setting(promptsContent)
            .setName('Flashcard System Prompt')
            .setDesc('System prompt used for generating flashcards');
        
        let flashcardPromptArea: TextAreaComponent;
        flashcardPromptSetting.addTextArea(textarea => {
            flashcardPromptArea = textarea;
            textarea
                .setValue(this.plugin.settings.flashcardSystemPrompt)
                .setPlaceholder('Create flashcards in this format...')
                .onChange(async (value) => {
                    this.plugin.settings.flashcardSystemPrompt = value;
                    await this.plugin.saveSettings();
                });
            
            textarea.inputEl.rows = 6;
            textarea.inputEl.cols = 50;
        });

        // Chat system prompt
        promptsContent.createEl('h3', { text: 'Chat Prompt' });
        
        const chatPromptSetting = new Setting(promptsContent)
            .setName('Chat System Prompt')
            .setDesc('System prompt used for chat sessions');
        
        let chatPromptArea: TextAreaComponent;
        chatPromptSetting.addTextArea(textarea => {
            chatPromptArea = textarea;
            textarea
                .setValue(this.plugin.settings.chatSystemPrompt)
                .setPlaceholder('You are a helpful AI assistant...')
                .onChange(async (value) => {
                    this.plugin.settings.chatSystemPrompt = value;
                    await this.plugin.saveSettings();
                });
            
            textarea.inputEl.rows = 4;
            textarea.inputEl.cols = 50;
        });

        // Reset prompts button
        new Setting(promptsContent)
            .setName('Reset Prompts')
            .setDesc('Reset all prompts to default values')
            .addButton(button => {
                button.setButtonText('Reset to Defaults');
                // 修复：不要链式调用
                button.onClick(async () => {
                    // Confirm before resetting
                    if (confirm('Are you sure you want to reset all prompts to default values?')) {
                        this.plugin.settings.globalSystemPrompt = this.plugin.DEFAULT_SETTINGS.globalSystemPrompt;
                        this.plugin.settings.explanationSystemPrompt = this.plugin.DEFAULT_SETTINGS.explanationSystemPrompt;
                        this.plugin.settings.summarySystemPrompt = this.plugin.DEFAULT_SETTINGS.summarySystemPrompt;
                        this.plugin.settings.flashcardSystemPrompt = this.plugin.DEFAULT_SETTINGS.flashcardSystemPrompt;
                        this.plugin.settings.chatSystemPrompt = this.plugin.DEFAULT_SETTINGS.chatSystemPrompt;
                        
                        // Update text areas
                        globalPromptArea.setValue(this.plugin.settings.globalSystemPrompt);
                        explanationPromptArea.setValue(this.plugin.settings.explanationSystemPrompt);
                        summaryPromptArea.setValue(this.plugin.settings.summarySystemPrompt);
                        flashcardPromptArea.setValue(this.plugin.settings.flashcardSystemPrompt);
                        chatPromptArea.setValue(this.plugin.settings.chatSystemPrompt);
                        
                        await this.plugin.saveSettings();
                        new Notice('All prompts reset to defaults');
                    }
                });
            });

        // TEMPLATES SETTINGS
        templatesContent.createEl('p', { 
            text: 'Configure templates for generated notes. Templates support variables like {{title}}, {{content}}, {{date}}, and custom variables.'
        });

        // Template file selector
        new Setting(templatesContent)
            .setName('Template File')
            .setDesc('Select a template file for explanation notes')
            .addText(text => text
                .setPlaceholder('path/to/template.md')
                .setValue(this.plugin.settings.templatePath)
                .onChange(async (value) => {
                    this.plugin.settings.templatePath = value;
                    await this.plugin.saveSettings();
                }))
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Browse');
                // 修复：不要链式调用
                button.onClick(async () => {
                    const modal = this.createFileSelectionModal((file) => {
                        if (file) {
                            this.plugin.settings.templatePath = file.path;
                            const textInput = button.buttonEl.parentElement?.querySelector('input') as HTMLInputElement;
                            if (textInput) {
                                textInput.value = file.path;
                            }
                            this.plugin.saveSettings();
                        }
                    });
                    modal.open();
                });
            });

        // Enable template usage
        new Setting(templatesContent)
            .setName('Use Template for Explanations')
            .setDesc('Use the selected template file for explanation notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useTemplateForExplanations)
                .onChange(async (value) => {
                    this.plugin.settings.useTemplateForExplanations = value;
                    await this.plugin.saveSettings();
                }));

        // Template preview
        templatesContent.createEl('h3', { text: 'Template Variables' });
        
        templatesContent.createEl('p', { 
            text: 'Built-in variables: {{title}}\n - note title, {{content}}\n - AI generated content, {{date}}\n - current date, {{query}}\n - original selected text' 
        });

        // Custom template variables
        templatesContent.createEl('h3', { text: 'Custom Template Variables' });
        
        // Container for custom variables
        const customVarsContainer = templatesContent.createDiv('synapse-custom-vars');
        
        // Function to refresh custom variables display
        const refreshCustomVariables = () => {
            customVarsContainer.empty();
            
            // Add existing variables
            for (const [key, value] of Object.entries(this.plugin.settings.customTemplateVariables)) {
                this.addCustomVariableRow(customVarsContainer, key, value);
            }
            
            // Add button to add new variable
            const addVarButton = customVarsContainer.createEl('button', {
                text: 'Add Custom Variable',
                cls: 'synapse-add-var-button'
            });
            
            addVarButton.addEventListener('click', () => {
                const newKey = `variable${Object.keys(this.plugin.settings.customTemplateVariables).length + 1}`;
                this.plugin.settings.customTemplateVariables[newKey] = '';
                this.plugin.saveSettings();
                refreshCustomVariables();
            });
        };
        
        // Initial display of custom variables
        refreshCustomVariables();

        // ADVANCED SETTINGS
        // Live features
        advancedContent.createEl('h3', { text: 'Live Features' });

        new Setting(advancedContent)
            .setName('Enable Live Chat')
            .setDesc('Enable interactive chat sessions in notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableLiveChat)
                .onChange(async (value) => {
                    this.plugin.settings.enableLiveChat = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(advancedContent)
            .setName('Enable Live Suggestions')
            .setDesc('Provide suggestions as you type (experimental)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableLiveSuggestions)
                .onChange(async (value) => {
                    this.plugin.settings.enableLiveSuggestions = value;
                    await this.plugin.saveSettings();
                    
                    // Update visibility of related settings
                    this.updateLiveFeatureSettingsVisibility();
                }));

        // Add simplified Live Copilot settings
        const liveSuggestionsContainer = advancedContent.createDiv('synapse-live-settings');
        liveSuggestionsContainer.createEl('h4', { text: 'Live Suggestions' });
                
        new Setting(liveSuggestionsContainer)
            .setName('Show Ghost Text')
            .setDesc('Show suggested text completions as you type')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showGhostText)
                .onChange(async (value) => {
                    this.plugin.settings.showGhostText = value;
                    await this.plugin.saveSettings();
                }))
            .setDisabled(!this.plugin.settings.enableLiveSuggestions);

        new Setting(liveSuggestionsContainer)
            .setName('Allow Quick Accept')
            .setDesc('Show accept button for suggestions')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.allowQuickAccept)
                .onChange(async (value) => {
                    this.plugin.settings.allowQuickAccept = value;
                    await this.plugin.saveSettings();
                }))
            .setDisabled(!this.plugin.settings.enableLiveSuggestions);
                
        new Setting(liveSuggestionsContainer)
            .setName('Suggestion Delay')
            .setDesc('Delay before showing suggestions (milliseconds)')
            .addSlider(slider => slider
                .setLimits(500, 5000, 100)
                .setValue(this.plugin.settings.suggestionDelay)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.suggestionDelay = value;
                    await this.plugin.saveSettings();
                }))
            .setDisabled(!this.plugin.settings.enableLiveSuggestions);

        // Helper method to show/hide settings based on feature enablement
        this.updateLiveFeatureSettingsVisibility();
    }

    private updateLiveFeatureSettingsVisibility() {
        const liveSettingsDiv = this.containerEl.querySelector('.synapse-live-settings');
        if (liveSettingsDiv) {
            liveSettingsDiv.style.display = this.plugin.settings.enableLiveSuggestions ? 'block' : 'none';
        }
    }

    private async loadAvailableModels(dropdown: DropdownComponent) {
        try {
            // Clear dropdown
            dropdown.selectEl.empty();
            dropdown.addOption('', 'Loading models...');
            
            // Create new Ollama client
            const client = new OllamaClient(this.plugin.settings.ollamaUrl, '');
            const models = await client.getAvailableModels();
            
            // Update dropdown with available models
            dropdown.selectEl.empty();
            
            if (models.length === 0) {
                dropdown.addOption('', 'No models found');
            } else {
                models.forEach(model => {
                    dropdown.addOption(model, model);
                });
                
                // Select current model if available
                if (models.includes(this.plugin.settings.ollamaModel)) {
                    dropdown.setValue(this.plugin.settings.ollamaModel);
                }
            }
        } catch (error) {
            console.error('Error loading models:', error);
            dropdown.selectEl.empty();
            dropdown.addOption('', 'Error loading models');
        }
    }

    private addCustomVariableRow(container: HTMLElement, key: string, value: string) {
        const row = container.createDiv('synapse-custom-var-row');
        
        // Create key input
        const keyInput = row.createEl('input', {
            type: 'text',
            value: key,
            placeholder: 'Variable name'
        });
        
        // Create value input
        const valueInput = row.createEl('input', {
            type: 'text',
            value: value,
            placeholder: 'Value'
        });
        
        // Create delete button
        const deleteButton = row.createEl('button', {
            text: '✕',
            cls: 'synapse-delete-var-button'
        });
        
        // Add event listeners
        keyInput.addEventListener('change', () => {
            // Remove old key
            delete this.plugin.settings.customTemplateVariables[key];
            
            // Add with new key
            this.plugin.settings.customTemplateVariables[keyInput.value] = valueInput.value;
            this.plugin.saveSettings();
        });
        
        valueInput.addEventListener('change', () => {
            this.plugin.settings.customTemplateVariables[key] = valueInput.value;
            this.plugin.saveSettings();
        });
        
        deleteButton.addEventListener('click', () => {
            delete this.plugin.settings.customTemplateVariables[key];
            this.plugin.saveSettings();
            row.remove();
        });
    }

    private createFileSelectionModal(callback: (file: TFile | null) => void) {
        const { modal, contentEl } = this.createModal('Select Template File');
        
        // Create search input
        const searchEl = contentEl.createEl('input', {
            type: 'text',
            placeholder: 'Search files...'
        });
        
        // Create file list container
        const fileListEl = contentEl.createDiv('synapse-file-list');
        
        // Get all markdown files in vault
        const markdownFiles = this.app.vault.getMarkdownFiles();
        
        // Function to display files
        const displayFiles = (files: TFile[]) => {
            fileListEl.empty();
            
            if (files.length === 0) {
                fileListEl.createEl('div', { text: 'No files found' });
                return;
            }
            
            for (const file of files) {
                const fileItem = fileListEl.createDiv('synapse-file-item');
                fileItem.setText(file.path);
                
                fileItem.addEventListener('click', () => {
                    callback(file);
                    modal.close();
                });
            }
        };
        
        // Initial display of all files
        displayFiles(markdownFiles);
        
        // Add search functionality
        searchEl.addEventListener('input', () => {
            const searchTerm = searchEl.value.toLowerCase();
            const filteredFiles = markdownFiles.filter(file => 
                file.path.toLowerCase().includes(searchTerm)
            );
            displayFiles(filteredFiles);
        });
        
        // Add cancel button
        const footerEl = contentEl.createDiv('synapse-modal-footer');
        const cancelButton = footerEl.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => {
            callback(null);
            modal.close();
        });
        
        return modal;
    }

    private createModal(title: string) {
        const modal = new (require('obsidian').Modal)(this.app) as any;
        modal.titleEl.setText(title);
        modal.contentEl.addClass('synapse-modal');
        
        return { modal, contentEl: modal.contentEl };
    }
}