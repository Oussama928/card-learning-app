export type NotificationType = 'reminder' | 'feature' | 'system' | 'streak';

export interface RegisterRequestDTO {
  email: string;
  username: string;
}

export interface SignupResponseDTO {
  message: string;
  userId?: string;
  email?: string;
  requiresVerification?: boolean;
}

export interface VerifyEmailRequestDTO {
  email: string;
  otp: string;
}

export interface VerifyEmailResponseDTO {
  message: string;
}

export interface ResendOtpRequestDTO {
  email: string;
}

export interface ResendOtpResponseDTO {
  message: string;
}

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface ForgotPasswordResponseDTO {
  message: string;
}

export interface ResetPasswordRequestDTO {
  token: string;
  password: string;
}

export interface ResetPasswordResponseDTO {
  message: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OwnerSummaryDTO {
  id: string;
  username: string;
  email?: string;
  image?: string;
}

export interface CardResponseDTO {
  id: string;
  title: string;
  target_language: string;
  total_words: number;
  description?: string;
  user_id?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CardWithOwnerDTO extends CardResponseDTO {
  owner?: OwnerSummaryDTO;
}

export interface CardDetailResponseDTO {
  message?: string;
  id: string;
  title: string;
  targetLanguage: string;
  description: string;
  cardData: Array<[string, string, number, boolean]>;
}

export interface GetCardsResponseDTO {
  cards: CardWithOwnerDTO[];
  pagination: PaginationDTO;
}

export interface CreateCardRequestDTO {
  title: string;
  targetLanguage: string;
  description: string;
  agreed: boolean;
  words?: string[][];
  fileContent?: string;
  edit?: boolean;
  id?: string;
  garbageCollector?: number[];
}

export interface CreateWordProgressRequestDTO {
  word_id: number;
  is_learned: boolean;
}

export interface ProgressItemDTO {
  word_id: number;
  original: string;
  translation: string;
  is_learned: boolean;
  correct_count?: number;
  incorrect_count?: number;
  lastReviewed?: string;
}

export interface GetProgressResponseDTO {
  message: string;
  card_id?: string;
  progress: ProgressItemDTO[];
}

export interface PostProgressResponseDTO {
  success: boolean;
  message: string;
}

export interface UserStatsDTO {
  total_words: number;
  learned_words: number;
  in_progress: number;
  not_started: number;
  accuracy: number;
  daily_streak?: number;
  total_xp?: number;
}

export interface GetStatsResponseDTO {
  stats: UserStatsDTO;
  card_id?: string;
}

export interface GlobalStatsDTO {
  username: string;
  id: string;
  xp: number;
  image?: string;
}

export interface GetGlobalStatsResponseDTO {
  message: string;
  topXpResult: GlobalStatsDTO[];
}

export interface UpdateStreakResponseDTO {
  success: boolean;
  streak: number;
  message?: string;
}

export interface NotificationItemDTO {
  id: string;
  type: NotificationType;
  content: string;
  created_at: string;
  is_read?: boolean;
}

export interface CreateNotificationRequestDTO {
  type: NotificationType;
  content: string;
}

export interface GetNotificationsResponseDTO {
  notifs: NotificationItemDTO[];
  pagination?: PaginationDTO;
  new?: boolean;
}

export interface DeleteNotificationResponseDTO {
  success: boolean;
  message: string;
}

export interface HandleFavoritesRequestDTO {
  card_id: string;
  intent: 'add' | 'remove';
}

export interface HandleFavoritesResponseDTO {
  success: boolean;
  message: string;
  favId?: string;
  error?: string;
}

export interface FavoritesResponseDTO {
  message: string;
  favorites: string[];
  fullFavorites: CardWithOwnerDTO[];
  favId?: string;
}

export interface SearchQueryDTO {
  searchQuery: string;
  page?: number;
  type?: 'cards' | 'users' | 'all';
}

export interface SearchResultDTO extends CardWithOwnerDTO {
  type: 'cards' | 'users' | 'all';
}

export interface SearchResponseDTO {
  results: SearchResultDTO[];
  pagination: PaginationDTO;
}

export interface UpdateProfileRequestDTO {
  field: 'bio' | 'country' | 'username';
  value: string;
}

export interface UpdateProfileResponseDTO {
  success: boolean;
  message?: string;
  updated_user?: {
    id: string;
    email: string;
    username: string;
    image?: string | null;
    bio?: string;
    country?: string;
  };
}

export interface ApiSuccessResponseDTO<T = any> {
  success: true;
  message?: string;
  data?: T;
}

export interface ApiErrorResponseDTO {
  success: false;
  error: string;
  message?: string;
  details?: string;
}

export type ApiResponseDTO<T = any> = ApiSuccessResponseDTO<T> | ApiErrorResponseDTO;

export interface AddCardResponseDTO {
  success: boolean;
  cardId?: string;
  message?: string;
}
