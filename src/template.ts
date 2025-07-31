import { App, TFile } from 'obsidian';

export class TemplateProcessor {
    private app: App;
    
    constructor(app: App) {
        this.app = app;
    }
    
    /**
     * Process a template file with variables
     * @param templatePath Path to the template file
     * @param variables Variables to replace in the template
     * @returns Processed template content
     */
    async processTemplate(templatePath: string, variables: Record<string, string>): Promise<string> {
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
                templateContent = templateContent.replace(
                    new RegExp(`{{\\s*${key}\\s*}}`, 'g'), 
                    value
                );
            }
            
            return templateContent;
        } catch (error) {
            console.error('Template error:', error);
            throw new Error(`Failed to process template: ${error.message}`);
        }
    }
    
    /**
     * Check if a template file exists
     * @param templatePath Path to the template file
     * @returns Whether the template file exists
     */
    templateExists(templatePath: string): boolean {
        const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
        return templateFile instanceof TFile;
    }
    
    /**
     * Get all available templates in the vault
     * @returns Array of template files
     */
    getAllTemplates(): TFile[] {
        return this.app.vault.getMarkdownFiles().filter(file => 
            file.path.includes('template') || file.path.includes('Template')
        );
    }
}
