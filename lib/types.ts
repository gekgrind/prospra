export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  business_idea: string | null;
  industry: string | null;
  experience_level: string | null;
  goals: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  progress_notes: string | null;
  challenges: string | null;
  wins: string | null;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}
