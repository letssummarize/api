
export enum SummaryLength {
    SHORT= 'brief',
    STANDARD = 'standard',
    DETAILED = 'comprehensive'
}

export enum SummaryFormat {
    BULLET_POINTS = 'bullet-points',
    NARRATIVE = 'narrative',
    DEFAULT = 'default',
}

export enum SummarizationModel {
    OPENAI = 'openai',
    DEEPSEEK = 'deepseek',
    GEMENI = 'gemini',
    DEFAULT = OPENAI,
}

export enum SummarizationSpeed {
    FAST = 'fast',
    SLOW = 'slow',
    DEFAULT = FAST,
}

export enum SummarizationLanguage {
    EN = 'english',
    AR = 'arabic',
    DEFAULT = 'default'
}

export enum STTModel {
    FAST_WHISPER = 'faster-whisper',
    OPENAI_WHISPER = 'whisper-1',
    DEFAULT = OPENAI_WHISPER
}