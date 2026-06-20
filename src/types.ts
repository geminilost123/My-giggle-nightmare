export interface Message {
  role: 'user' | 'assistant' | 'system';
  type: 'text' | 'image' | 'video' | 'storyboard' | 'error';
  content?: string;
  src?: string;
  alt?: string;
  hostedUrl?: string | null;
  modelLabel?: string;
  engineLabel?: string;
  storedDuration?: number;
  storedRes?: string;
  videoPrompt?: string;
  reason?: string;
  frameId?: string;
  isPe?: boolean;
}

export interface HistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string | any;
}

export interface Character {
  name: string;
  desc: string;
}

export interface StorySetup {
  premise: string;
  tone: string;
  style: string;
  characters: string;
}

export interface Thread {
  id: string;
  name: string;
  createdAt: number;
  messages: Message[];
  history: HistoryItem[];
  cast: Character[];
  setup?: StorySetup;
}

export interface LoRA {
  id: number;
  name: string;
  url: string;
  trigger: string;
  scale: number;
  base: string;
  notes: string;
  active: boolean;
}

export interface PromptTemplate {
  type: 'image' | 'video' | 'edit' | 'modifier';
  cat: string;
  title: string;
  text: string;
  isUser?: boolean;
}
