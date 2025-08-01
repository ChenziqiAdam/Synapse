import { Editor, TFile, Notice, App, MarkdownView } from 'obsidian';
import { OllamaClient } from './ollama';
import { SynapseSettings } from './settings';

export class SynapseCommands {
    private app: App;
    private ollama: OllamaClient;
    private settings: SynapseSettings;

    constructor(app: App, ollama: OllamaClient, settings: SynapseSettings) {
        this.app = app;
        this.ollama = ollama;
        this.settings = settings;
    }

    updateSettings(settings: SynapseSettings) {
        this.settings = settings;
        this.ollama = new OllamaClient(settings.ollamaUrl, settings.ollamaModel);
    }

    async explainAndLink(editor: Editor, selectedText: string): Promise<void> {
        if (!selectedText.trim()) {
            new Notice('Please select text to explain');
            return;
        }

        const noticeLoading = new Notice('Generating explanation...', 0);
        
        try {
            // Generate explanation
            const systemPrompt = this.processTemplateVariables(this.settings.explanationSystemPrompt);
            
            const prompt = `Explain this concept: "${selectedText}"`;
            const explanation = await this.ollama.generate(prompt, systemPrompt);

            // Create note filename (sanitize)
            const noteTitle = this.sanitizeFileName(selectedText);
            
            // Create folder if it doesn't exist
            await this.ensureFolderExists(this.settings.explanationFolder);
            
            // Create path with folder
            const filePath = `${this.settings.explanationFolder}/${noteTitle}.md`;

            // Check if note already exists
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                new Notice(`Note "${noteTitle}" already exists`);
                noticeLoading.hide();
                return;
            }

            // Create new note content - either from template or from scratch
            let noteContent;
            
            if (this.settings.useTemplateForExplanations && this.settings.templatePath) {
                // Use template if enabled and template path is set
                noteContent = await this.generateFromTemplate(
                    this.settings.templatePath, 
                    {
                        title: noteTitle,
                        content: explanation,
                        date: new Date().toLocaleDateString(),
                        query: selectedText,
                        tags: this.getTagsString(),
                        ...this.settings.customTemplateVariables
                    }
                );
            } else {
                // Use default format with optional tags
                const tagsLine = this.getTagsString() ? `\ntags: ${this.getTagsString()}` : '';
                
                noteContent = `# ${noteTitle}${tagsLine}

${explanation}

---
*Generated by Synapse AI*
*Created: ${new Date().toLocaleDateString()}*`;
            }

            // Create the new note
            const newFile = await this.app.vault.create(filePath, noteContent);

            // Insert link in current editor
            const link = `[[${filePath.replace('.md', '')}|${noteTitle}]]`;
            editor.replaceSelection(link);

            // Open the new note
            await this.app.workspace.getLeaf().openFile(newFile);

            noticeLoading.hide();
            new Notice(`Created and linked note: ${noteTitle}`);

        } catch (error) {
            noticeLoading.hide();
            new Notice(`Error: ${error.message}`);
            console.error('Explain and Link error:', error);
        }
    }

    async summarizeNote(editor: Editor, content: string): Promise<void> {
        if (!content.trim()) {
            new Notice('No content to summarize');
            return;
        }

        const noticeLoading = new Notice('Generating summary...', 0);

        try {
            const systemPrompt = this.processTemplateVariables(this.settings.summarySystemPrompt);

            const prompt = `Summarize this content:\n\n${content}`;
            const summary = await this.ollama.generate(prompt, systemPrompt);

            // Format summary based on settings
            let summarySection;
            
            if (this.settings.useSummaryYaml) {
                // Format as YAML
                summarySection = `---
summary:
${summary.split('\n').map(line => `  ${line}`).join('\n')}
---

`;
            } else {
                // Format as regular markdown
                summarySection = `## Summary

${summary}

---

`;
            }

            // Insert summary at specified location
            if (this.settings.summaryLocation === 'top') {
                // Find first heading or insert at beginning
                const lines = content.split('\n');
                let insertIndex = 0;
                
                // Skip front matter if exists
                if (lines[0]?.startsWith('---')) {
                    let endFrontMatter = lines.findIndex((line, i) => i > 0 && line.startsWith('---'));
                    if (endFrontMatter !== -1) {
                        insertIndex = endFrontMatter + 1;
                    }
                }

                // If we're using YAML and there's already frontmatter, we need to merge them
                if (this.settings.useSummaryYaml && lines[0]?.startsWith('---')) {
                    const endFrontMatter = lines.findIndex((line, i) => i > 0 && line.startsWith('---'));
                    if (endFrontMatter !== -1) {
                        // Extract existing frontmatter
                        const existingFrontmatter = lines.slice(0, endFrontMatter + 1).join('\n');
                        // Remove closing delimiter
                        const openFrontmatter = existingFrontmatter.replace(/---\s*$/, '');
                        // Add summary to frontmatter
                        const summaryYaml = `summary:
${summary.split('\n').map(line => `  ${line}`).join('\n')}
---`;
                        // Combine
                        const newContent = openFrontmatter + summaryYaml + '\n\n' + lines.slice(endFrontMatter + 1).join('\n');
                        editor.setValue(newContent);
                        noticeLoading.hide();
                        new Notice('Summary added to frontmatter');
                        return;
                    }
                }

                const newContent = [
                    ...lines.slice(0, insertIndex),
                    '',
                    summarySection,
                    ...lines.slice(insertIndex)
                ].join('\n');

                editor.setValue(newContent);
            } else {
                // Insert at bottom
                editor.setValue(content + '\n\n' + summarySection);
            }

            noticeLoading.hide();
            new Notice('Summary added to note');

        } catch (error) {
            noticeLoading.hide();
            new Notice(`Error: ${error.message}`);
            console.error('Summarize error:', error);
        }
    }

    async createFlashcards(editor: Editor, selectedText: string): Promise<void> {
        if (!selectedText.trim()) {
            new Notice('Please select text to create flashcards from');
            return;
        }

        const noticeLoading = new Notice('Creating flashcards...', 0);

        try {
            const systemPrompt = this.processTemplateVariables(this.settings.flashcardSystemPrompt);

            const prompt = `Create flashcards from this content:\n\n${selectedText}`;
            const flashcards = await this.ollama.generate(prompt, systemPrompt);

            // Decide if we should create a new flashcard note or insert into current note
            const activeFile = this.app.workspace.getActiveFile();
            const noteTitle = activeFile ? activeFile.basename : "Untitled";
            
            // Create flashcards note in dedicated folder
            await this.ensureFolderExists(this.settings.flashcardFolder);
            const flashcardFileName = `${this.settings.flashcardFolder}/${noteTitle} - Flashcards.md`;
            
            // Add tags if enabled
            const tagsLine = this.getTagsString() ? `\ntags: ${this.getTagsString()}` : '';
            
            const flashcardContent = `# Flashcards for ${noteTitle}${tagsLine}

${flashcards}

---
*Generated from: [[${activeFile ? activeFile.path.replace('.md', '') : 'Unknown source'}]]*
*Created: ${new Date().toLocaleDateString()}*
`;

            // Check if flashcard file exists and append or create
            const existingFile = this.app.vault.getAbstractFileByPath(flashcardFileName);
            
            if (existingFile instanceof TFile) {
                // Append to existing file
                const existingContent = await this.app.vault.read(existingFile);
                const newContent = existingContent + "\n\n## New Flashcards\n\n" + flashcards;
                await this.app.vault.modify(existingFile, newContent);
                
                // Open the file
                await this.app.workspace.getLeaf().openFile(existingFile);
                
                noticeLoading.hide();
                new Notice('Added flashcards to existing note');
            } else {
                // Create new file
                const newFile = await this.app.vault.create(flashcardFileName, flashcardContent);
                
                // Open the file
                await this.app.workspace.getLeaf().openFile(newFile);
                
                noticeLoading.hide();
                new Notice('Created new flashcards note');
            }

            // Also add link to current note
            const link = `\n\n[[${flashcardFileName.replace('.md', '')}|Flashcards for this note]]\n`;
            const cursor = editor.getCursor();
            editor.setLine(cursor.line, editor.getLine(cursor.line) + link);

        } catch (error) {
            noticeLoading.hide();
            new Notice(`Error: ${error.message}`);
            console.error('Create Flashcards error:', error);
        }
    }

    async startChatSession(editor: Editor): Promise<void> {
        // Create a new chat note in the chat folder
        await this.ensureFolderExists(this.settings.chatFolder);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const chatFileName = `${this.settings.chatFolder}/Chat-${timestamp}.md`;
        
        // Add tags if enabled
        const tagsLine = this.getTagsString() ? `\ntags: ${this.getTagsString()}` : '';
        
        const chatTemplate = `# Chat Session ${new Date().toLocaleString()}${tagsLine}

## Context
*This is a chat session with Synapse AI. Type your messages after the > prompt.*

## Chat

> 

`;
        
        const newFile = await this.app.vault.create(chatFileName, chatTemplate);
        
        // Open the file
        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(newFile);
        
        // Position cursor at the prompt
        const newEditor = this.getActiveEditor();
        if (newEditor) {
            const lines = chatTemplate.split('\n');
            const promptLine = lines.findIndex(line => line === '> ');
            if (promptLine !== -1) {
                newEditor.setCursor({ line: promptLine, ch: 2 });
                newEditor.focus();
            }
        }
        
        new Notice('Started new chat session');
    }

    async sendChatMessage(editor: Editor): Promise<void> {
        // Find the current chat message (line starting with '>')
        const content = editor.getValue();
        const lines = content.split('\n');
        const currentLine = editor.getCursor().line;
        
        // Locate the prompt
        let promptLine = currentLine;
        while (promptLine >= 0 && !lines[promptLine].startsWith('>')) {
            promptLine--;
        }
        
        if (promptLine < 0) {
            new Notice('No chat prompt found. Please start message with >');
            return;
        }
        
        // Extract message
        const userMessage = lines[promptLine].substring(2).trim();
        if (!userMessage) {
            new Notice('Please type a message first');
            return;
        }
        
        // Update the chat with the user message
        lines[promptLine] = `> ${userMessage}`;
        
        // Add a loading indicator
        lines.splice(promptLine + 1, 0, '\n_Synapse is thinking..._');
        editor.setValue(lines.join('\n'));
        
        // Get chat history for context
        const chatHistory = this.extractChatHistory(lines, promptLine);
        
        try {
            // Generate response
            const systemPrompt = this.processTemplateVariables(this.settings.chatSystemPrompt);
            
            const response = await this.ollama.generate(userMessage, systemPrompt, chatHistory);
            
            // Remove loading indicator
            lines.splice(promptLine + 1, 1);
            
            // Add AI response and new prompt
            lines.splice(promptLine + 1, 0, 
                `\n${response}\n`,
                `> `
            );
            
            // Save current scroll position
            const scrollInfo = editor.getScrollInfo ? editor.getScrollInfo() : null;
            
            editor.setValue(lines.join('\n'));
            
            // Improved cursor positioning and view scrolling logic
            setTimeout(() => {
                // Get updated content
                const updatedContent = editor.getValue();
                const updatedLines = updatedContent.split('\n');
                
                // Find the new prompt line after the current one
                let newPromptLine = -1;
                for (let i = promptLine + 1; i < updatedLines.length; i++) {
                    if (updatedLines[i] === '> ') {
                        newPromptLine = i;
                        break;
                    }
                }
                
                // If we found the new prompt line, position cursor after ">"
                if (newPromptLine >= 0) {
                    // Set cursor position
                    editor.setCursor({ line: newPromptLine, ch: 2 });
                    
                    // Scroll to the new cursor position
                    const cmEditor = (editor as any).cm;
                    if (cmEditor) {
                        // CodeMirror 6
                        if (cmEditor.scrollIntoView) {
                            cmEditor.scrollIntoView({ 
                                line: newPromptLine, 
                                ch: 2 
                            }, 100); // 100px margin from bottom
                        }
                    } else {
                        // Use scrollIntoView API (if available)
                        editor.scrollIntoView({
                            from: { line: newPromptLine, ch: 0 },
                            to: { line: newPromptLine, ch: 2 }
                        }, true);
                    }
                    
                    // Ensure view stays at bottom
                    const editorElement = document.querySelector('.cm-scroller');
                    if (editorElement) {
                        // Scroll to bottom of the current view
                        editorElement.scrollTop = editorElement.scrollHeight;
                    }
                    
                    editor.focus();
                }
            }, 100); // Increased delay to ensure editor content and DOM are fully updated
        } catch (error) {
            new Notice(`Error: ${error.message}`);
            console.error('Chat error:', error);
            
            // Remove loading indicator and add error message
            lines.splice(promptLine + 1, 1);
            lines.splice(promptLine + 1, 0, '_Error: Could not generate response_');
            editor.setValue(lines.join('\n'));
        }
    }
    
    async generateLiveSuggestion(editor: Editor): Promise<void> {
        if (!this.settings.enableLiveSuggestions) return;
        
        // Get current context
        const content = editor.getValue();
        const cursor = editor.getCursor();
        const currentLine = cursor.line;
        
        // Get a few lines before current line for context
        const contextLines = content.split('\n').slice(Math.max(0, currentLine - 10), currentLine + 5);
        const context = contextLines.join('\n');
        
        if (context.trim().length < 5) return; // Not enough context
        
        try {
            // Traditional text continuation
            const systemPrompt = `You are an AI writing assistant. 
            Based on the context provided, suggest a brief continuation (1-3 words maximum).
            Make your suggestion directly relevant to what's being written.
            Do not repeat what's already written. 
            Only return the continuation text. Do not include any additional text or formatting.`;
            
            const response = await this.ollama.generate(`Continue this text: ${context}`, systemPrompt);
            
            // Display suggestion as ghost text
            this.displayGhostText(editor, response);
        } catch (error) {
            console.error('Suggestion error:', error);
        }
    }

    private displayGhostText(editor: Editor, text: string): void {
        // Display ghost text suggestion
        if (!this.settings.showGhostText) return;
        
        // Create a notice with the suggestion
        const notice = new Notice(`Suggestion: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`, 5000);
        
        // Add an accept button
        if (this.settings.allowQuickAccept) {
            const noticeEl = notice.noticeEl;
            const buttonContainer = noticeEl.createDiv('synapse-suggestion-actions');
            
            const acceptButton = buttonContainer.createEl('button', {
                text: 'Accept',
                cls: 'synapse-accept-button'
            });
            
            acceptButton.addEventListener('click', () => {
                const cursor = editor.getCursor();
                editor.replaceRange(text, cursor);
                notice.hide();
            });
        }
    }

    // New method to process template variables in prompts
    private processTemplateVariables(text: string): string {
        let processed = text;
        
        // Replace built-in variables
        processed = processed.replace(/{{maxResponseLength}}/g, this.settings.maxResponseLength.toString());
        processed = processed.replace(/{{model}}/g, this.settings.ollamaModel);
        processed = processed.replace(/{{date}}/g, new Date().toLocaleDateString());
        
        // Replace custom variables
        for (const [key, value] of Object.entries(this.settings.customTemplateVariables)) {
            processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        
        return processed;
    }

    // New method to generate note content from template
    private async generateFromTemplate(templatePath: string, variables: Record<string, string>): Promise<string> {
        try {
            // Get template file
            const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
            if (!(templateFile instanceof TFile)) {
                throw new Error(`Template file not found: ${templatePath}`);
            }
            
            // Read template content
            let templateContent = await this.app.vault.read(templateFile);
            
            // Replace variables
            for (const [key, value] of Object.entries(variables)) {
                templateContent = templateContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }
            
            return templateContent;
        } catch (error) {
            console.error('Template error:', error);
            throw new Error(`Failed to process template: ${error.message}`);
        }
    }

    private sanitizeFileName(text: string): string {
        // Remove or replace invalid characters for file names
        return text
            .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, hyphens
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim()
            .substring(0, 50); // Limit length
    }
    
    private async ensureFolderExists(folderPath: string): Promise<void> {
        if (!folderPath) return;
        
        const folders = folderPath.split('/').filter(p => p.trim());
        let currentPath = '';
        
        for (const folder of folders) {
            currentPath = currentPath ? `${currentPath}/${folder}` : folder;
            if (!this.app.vault.getAbstractFileByPath(currentPath)) {
                try {
                    await this.app.vault.createFolder(currentPath);
                } catch (error) {
                    console.error(`Failed to create folder ${currentPath}:`, error);
                }
            }
        }
    }
    
    private getActiveEditor(): Editor | null {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        return view?.editor || null;
    }
    
    private extractChatHistory(lines: string[], currentPromptLine: number): string {
        // Extract all previous exchanges to give context to the AI
        let chatHistory = '';
        let inChat = false;
        
        for (let i = 0; i < currentPromptLine; i++) {
            const line = lines[i];
            
            // Check if we've reached the chat section
            if (line === '## Chat') {
                inChat = true;
                continue;
            }
            
            if (inChat) {
                if (line.startsWith('> ')) {
                    chatHistory += `User: ${line.substring(2)}\n`;
                } else if (line.trim() && !line.startsWith('_') && line !== '') {
                    chatHistory += `AI: ${line}\n`;
                }
            }
        }
        
        return chatHistory;
    }

    // Helper method to get formatted tags string
    private getTagsString(): string {
        if (!this.settings.addSynapseTag || !this.settings.synapseTag) {
            return '';
        }
        
        // Format tags properly for YAML
        const tags = this.settings.synapseTag.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag)
            .map(tag => {
                // If tag doesn't start with #, add it
                return tag.startsWith('#') ? tag : `#${tag}`;
            });
            
        return tags.join(' ');
    }
}