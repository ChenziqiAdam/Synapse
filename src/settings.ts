export interface SynapseSettings {
    ollamaUrl: string;
    ollamaModel: string;
    autoLinkEnabled: boolean;
    summaryLocation: 'top' | 'bottom';
    flashcardFormat: 'simple' | 'spaced';
    maxResponseLength: number;
    explanationFolder: string;
    flashcardFolder: string;
    useSummaryYaml: boolean;
    chatFolder: string;
    enableLiveChat: boolean;
    enableLiveSuggestions: boolean;
    suggestionDelay: number;
    // Simplified Live Copilot settings
    showGhostText: boolean;
    allowQuickAccept: boolean;
    // New settings
    templatePath: string;
    useTemplateForExplanations: boolean;
    globalSystemPrompt: string;
    chatSystemPrompt: string;
    explanationSystemPrompt: string;
    summarySystemPrompt: string;
    flashcardSystemPrompt: string;
    customTemplateVariables: Record<string, string>;
}

export const DEFAULT_SETTINGS: SynapseSettings = {
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'gemma3n:e2b',
    autoLinkEnabled: true,
    summaryLocation: 'top',
    flashcardFormat: 'simple',
    maxResponseLength: 1000,
    explanationFolder: 'Explanations',
    flashcardFolder: 'Flashcards',
    useSummaryYaml: true,
    chatFolder: 'Chats',
    enableLiveChat: true,
    enableLiveSuggestions: false,
    suggestionDelay: 3000,
    // Simplified settings with defaults
    showGhostText: true,
    allowQuickAccept: true,
    // New default settings
    templatePath: '',
    useTemplateForExplanations: false,
    globalSystemPrompt: 'You are a helpful educational assistant providing concise, accurate information.',
    chatSystemPrompt: 'You are a helpful AI assistant in a chat session. Provide thoughtful, concise responses to the user\'s questions. Use markdown formatting when appropriate. Reference prior messages in the conversation when relevant.',
    explanationSystemPrompt: 'You are a helpful educational assistant. Create a clear, concise explanation of the given concept. Format your response as a well-structured note with:\n1. A brief definition\n2. Key characteristics or properties\n3. A simple analogy or example if helpful\n4. Why this concept is important\n\nKeep the explanation under {{maxResponseLength}} characters and use clear, educational language.',
    summarySystemPrompt: 'You are a helpful assistant that creates concise summaries. Create a bullet-point summary (3-5 points) of the main ideas in the given text. Each bullet point should be clear and capture a key concept. Format as markdown bullets starting with "- ".',
    flashcardSystemPrompt: 'You are a helpful assistant that creates study flashcards. From the given text, identify 3-7 key concepts and create flashcards in this exact format:\n\n**Q:** Question here?\n**A:** Answer here\n\nMake questions clear and specific. Answers should be concise but complete. Focus on the most important concepts for learning and retention.',
    customTemplateVariables: {}
};
