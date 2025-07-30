export interface OllamaResponse {
    response: string;
    done: boolean;
    context?: number[];
}

export class OllamaClient {
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string, model: string) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.model = model;
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async generate(prompt: string, systemPrompt?: string, chatHistory?: string): Promise<string> {
        try {
            // If chat history is provided, format it nicely
            let fullPrompt = prompt;
            if (chatHistory && chatHistory.trim()) {
                fullPrompt = `Chat history:\n${chatHistory}\n\nCurrent message: ${prompt}`;
            }
            
            const requestBody = {
                model: this.model,
                prompt: fullPrompt,
                system: systemPrompt || '',
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    top_k: 40,
                }
            };

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data: OllamaResponse = await response.json();
            return data.response.trim();
        } catch (error) {
            throw new Error(`Failed to generate response: ${error.message}`);
        }
    }

    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.status}`);
            }
            
            const data = await response.json();
            return data.models?.map((model: any) => model.name) || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    }
}
