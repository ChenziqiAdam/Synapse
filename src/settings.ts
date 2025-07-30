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
    suggestionDelay: 1000
};
