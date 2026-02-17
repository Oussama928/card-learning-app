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
  image_url?: string | null;
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

export interface ClassGroup {
  id: number;
  name: string;
  description?: string | null;
  owner_user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClassCard {
  id: number;
  class_id: number;
  card_id: string;
  position?: number;
}

export interface StudyGroup {
  id: number;
  name: string;
  description?: string | null;
  teacher_user_id: number;
  visibility: 'public' | 'private';
  join_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudyGroupMember {
  id: number;
  group_id: number;
  user_id: number;
  joined_at?: string;
}

export interface StudyGroupAssignment {
  id: number;
  group_id: number;
  assigned_by_user_id: number;
  assignment_type: 'card' | 'class';
  card_id?: number | null;
  class_id?: number | null;
  title?: string | null;
  due_at?: string | null;
  created_at?: string;
}

export interface StudyGroupPost {
  id: number;
  group_id: number;
  author_user_id: number;
  post_type: 'text' | 'link' | 'image';
  content: string;
  link_url?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudyGroupPostComment {
  id: number;
  post_id: number;
  parent_comment_id?: number | null;
  author_user_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}
