//these types represent the database schema and are used for typing data models and API responses   




export interface User {
  id: string;
  email: string;
  username?: string;
  password?: string; 
  image?: string;
  bio?: string;
  country?: string;
  role?: 'admin' | 'user';
  created_at?: string;
  updated_at?: string;
}




export interface Card {
  id: string;
  title: string;
  target_language: string;
  total_words: number;
  description?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  is_public?: boolean;
}




export interface Word {
  id: number;
  word: string;
  translated_word: string;
  hint?: string;
  card_id: string;
  created_at?: string;
}




export interface UserProgress {
  id: string;
  user_id: string;
  word_id: number;
  is_learned: boolean;
  correct_count?: number;
  incorrect_count?: number;
  last_reviewed?: string;
  created_at?: string;
  updated_at?: string;
}




export interface Notification {
  id: string;
  user_id?: string; // NULL means broadcast to all users btw
  type: 'reminder' | 'feature' | 'system' | 'streak';
  content: string;
  is_read?: boolean;
  created_at?: string;
}




export interface Favorite {
  id: string;
  user_id: string;
  card_id: string;
  created_at?: string;
}




export interface UserStats {
  user_id: string;
  total_terms_learned: number;
  accuracy: number;
  xp: number;
  daily_streak?: number;
  last_active?: string;
  created_at?: string;
  updated_at?: string;
}
