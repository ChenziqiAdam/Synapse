import { App, PluginSettingTab, Setting } from 'obsidian';
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

        containerEl.createEl('h2', { text: 'Synapse Settings' });

        // Ollama Configuration
        containerEl.createEl('h3', { text: 'Ollama Configuration' });

        new Setting(containerEl)
            .setName('Ollama URL')
            .setDesc('URL where Ollama is running (default: http://localhost:11434)')
            .addText(text => text
                .setPlaceholder('http://localhost:11434')
                .setValue(this.plugin.settings.ollamaUrl)
                .onChange(async (value) => {
                    this.plugin.settings.ollamaUrl = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Model')
            .setDesc('Ollama model to use (e.g., phi3:mini, llama2, mistral)')
            .addText(text => text
                .setPlaceholder('phi3:mini')
                .setValue(this.plugin.settings.ollamaModel)
                .onChange(async (value) => {
                    this.plugin.settings.ollamaModel = value;
                    await this.plugin.saveSettings();
                }));

        // Test connection button
        new Setting(containerEl)
            .setName('Test Connection')
            .setDesc('Test connection to Ollama')
            .addButton(button => button
                .setButtonText('Test')
                .setCta()
                .onClick(async () => {
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
                }));

        // Feature Settings
        containerEl.createEl('h3', { text: 'Feature Settings' });

        new Setting(containerEl)
            .setName('Auto-linking')
            .setDesc('Automatically create links when using "Explain & Link"')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoLinkEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.autoLinkEnabled = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
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
                
        new Setting(containerEl)
            .setName('Use YAML for Summaries')
            .setDesc('Add summaries to note frontmatter as YAML')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useSummaryYaml)
                .onChange(async (value) => {
                    this.plugin.settings.useSummaryYaml = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
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
        containerEl.createEl('h3', { text: 'Folder Organization' });
        
        new Setting(containerEl)
            .setName('Explanations Folder')
            .setDesc('Folder for explanation notes (empty for vault root)')
            .addText(text => text
                .setPlaceholder('Explanations')
                .setValue(this.plugin.settings.explanationFolder)
                .onChange(async (value) => {
                    this.plugin.settings.explanationFolder = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(containerEl)
            .setName('Flashcards Folder')
            .setDesc('Folder for flashcard notes (empty for vault root)')
            .addText(text => text
                .setPlaceholder('Flashcards')
                .setValue(this.plugin.settings.flashcardFolder)
                .onChange(async (value) => {
                    this.plugin.settings.flashcardFolder = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(containerEl)
            .setName('Chat Folder')
            .setDesc('Folder for chat session notes (empty for vault root)')
            .addText(text => text
                .setPlaceholder('Chats')
                .setValue(this.plugin.settings.chatFolder)
                .onChange(async (value) => {
                    this.plugin.settings.chatFolder = value;
                    await this.plugin.saveSettings();
                }));
                
        // Live features
        containerEl.createEl('h3', { text: 'Live Features' });

        new Setting(containerEl)
            .setName('Enable Live Chat')
            .setDesc('Enable interactive chat sessions in notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableLiveChat)
                .onChange(async (value) => {
                    this.plugin.settings.enableLiveChat = value;
                    await this.plugin.saveSettings();
                }));
                
        new Setting(containerEl)
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
        const liveSuggestionsContainer = containerEl.createDiv('synapse-live-settings');
                
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

        // Usage Instructions
        containerEl.createEl('h3', { text: 'Usage Instructions' });
        
        const instructions = containerEl.createDiv();
        instructions.innerHTML = `
            <p><strong>Commands available:</strong></p>
            <ul>
                <li><strong>Explain & Link:</strong> Select text and use command palette or right-click menu</li>
                <li><strong>Summarize Note:</strong> Run command to summarize entire current note</li>
                <li><strong>Create Flashcards:</strong> Select text to generate study flashcards</li>
                <li><strong>Start Chat Session:</strong> Begin an interactive chat with the AI</li>
                <li><strong>Send Chat Message:</strong> In a chat note, send the current line to the AI</li>
            </ul>
            <p><strong>Requirements:</strong> Make sure Ollama is installed and running with your selected model.</p>
        `;
    }

    private updateLiveFeatureSettingsVisibility() {
        const liveSettingsDiv = this.containerEl.querySelector('.synapse-live-settings');
        if (liveSettingsDiv) {
            liveSettingsDiv.style.display = this.plugin.settings.enableLiveSuggestions ? 'block' : 'none';
        }
    }
}