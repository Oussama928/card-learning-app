export type NotificationType = 'reminder' | 'feature' | 'system' | 'streak' | 'tier' | 'achievement';

export type TierNameDTO =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Titanium'
  | 'Legendary'
  | 'Godlike';

export interface TierDefinitionDTO {
  name: TierNameDTO;
  thresholdXp: number;
  logoUrl?: string | null;
}

export interface TierUnlockDTO {
  tier: TierDefinitionDTO;
  xpRemaining: number;
}

export interface UserTierProgressDTO {
  currentTier: TierDefinitionDTO;
  currentXp: number;
  percentileRanking: number;
  nextUnlock: TierUnlockDTO | null;
}

export type AchievementConditionTypeDTO =
  | 'cards_studied_total'
  | 'cards_created_total';

export interface AchievementBadgeDTO {
  key: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  conditionType: AchievementConditionTypeDTO;
  target: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string | null;
}

export interface AchievementDefinitionDTO {
  id: number;
  key: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  conditionType: AchievementConditionTypeDTO;
  target: number;
  xpReward: number;
  createdAt: string;
}

export interface CreateAchievementRequestDTO {
  name: string;
  description: string;
  conditionType: AchievementConditionTypeDTO;
  target: number;
  imageUrl?: string | null;
  xpReward?: number;
}

export interface CreateAchievementResponseDTO {
  success: boolean;
  achievement: AchievementDefinitionDTO;
  notifiedUsers: number;
}

export interface NotificationMetadataDTO {
  popupType?: 'tier_unlock' | 'achievement_unlock';
  tierName?: TierNameDTO;
  achievementKey?: string;
}

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
  cardData: StudyCardTermDTO[];
  progress?: StudyCardProgressDTO[];
}

export type StudyCardTermDTO = [
  string,
  string,
  number,
  boolean,
  string | null
];

export interface StudyCardProgressDTO {
  word_id: number;
  is_learned: boolean;
  correct_count: number;
  incorrect_count: number;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  last_reviewed?: string | null;
  next_review_at?: string | null;
}

export interface SpacedRepetitionStateDTO {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;
}

export interface SpacedRepetitionNextReviewDTO extends SpacedRepetitionStateDTO {
  isCorrect: boolean;
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
  words?: Array<[string, string, (number | boolean | string)?, string?]>;
  fileContent?: string;
  edit?: boolean;
  id?: string;
  garbageCollector?: number[];
}

export interface ActivityHeatmapDayDTO {
  date: string;
  reviews: number;
  correctReviews: number;
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
  repetitions?: number;
  interval_days?: number;
  ease_factor?: number;
  lastReviewed?: string | null;
  nextReviewAt?: string | null;
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
  activityHeatmap?: ActivityHeatmapDayDTO[];
  progression?: UserTierProgressDTO;
  achievements?: AchievementBadgeDTO[];
}

export interface ProfileStatsDTO {
  username: string;
  email: string;
  image?: string | null;
  country?: string | null;
  bio?: string | null;
  totalTermsLearned: number;
  totalWords: number;
  learnedWords: number;
  accuracy: number;
  xp: number;
  dailyStreak: number;
  lastLoginDate?: string | null;
  activityHeatmap: ActivityHeatmapDayDTO[];
  progression: UserTierProgressDTO;
  achievements: AchievementBadgeDTO[];
}

export interface GetStatsResponseDTO {
  stats: UserStatsDTO | ProfileStatsDTO;
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
  metadata?: NotificationMetadataDTO | null;
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

export type EmailTemplateDTO =
  | 'verify-email'
  | 'password-reset'
  | 'notification-digest'
  | 'daily-reminder';


export interface UploadResponseDTO {
  url: string;
  mimeType: string;
  size: number;
}

export interface HomeStudySessionDTO {
  id: number;
  title: string;
  description: string | null;
  targetLanguage: string;
  totalWords: number;
  learnedWords: number;
  lastReviewedAt: string;
}

export interface HomeOverviewDTO {
  mode: 'continue' | 'retry' | 'empty';
  unfinishedSessions: HomeStudySessionDTO[];
  completedSessions: HomeStudySessionDTO[];
}

export type StudyGroupVisibility = 'public' | 'private';
export type StudyGroupRole = 'teacher' | 'student';
export type StudyGroupPostType = 'text' | 'link' | 'image';
export type StudyAssignmentType = 'card' | 'class';

export interface StudyGroupDTO {
  id: number;
  name: string;
  description?: string | null;
  teacherId: number;
  teacherName?: string;
  visibility: StudyGroupVisibility;
  joinCode?: string | null;
  role: StudyGroupRole;
  createdAt: string;
}

export interface CreateStudyGroupRequestDTO {
  name: string;
  description?: string;
  visibility: StudyGroupVisibility;
}

export interface JoinStudyGroupRequestDTO {
  groupId?: number;
  joinCode?: string;
}

export interface StudyGroupAssignmentDTO {
  id: number;
  groupId: number;
  assignmentType: StudyAssignmentType;
  cardId?: number | null;
  classId?: number | null;
  title?: string | null;
  dueAt?: string | null;
  assignedBy: number;
  assignedByName?: string;
  createdAt: string;
}

export interface CreateStudyGroupAssignmentRequestDTO {
  assignmentType: StudyAssignmentType;
  cardId?: number;
  classId?: number;
  title?: string;
  dueAt?: string;
}

export interface StudyGroupCommentDTO {
  id: number;
  postId: number;
  parentCommentId?: number | null;
  authorUserId: number;
  authorName?: string;
  authorRole: StudyGroupRole;
  content: string;
  createdAt: string;
  replies: StudyGroupCommentDTO[];
}

export interface StudyGroupPostDTO {
  id: number;
  groupId: number;
  authorUserId: number;
  authorName?: string;
  authorRole?: StudyGroupRole;
  postType: StudyGroupPostType;
  content: string;
  linkUrl?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  comments: StudyGroupCommentDTO[];
}

export interface CreateStudyGroupPostRequestDTO {
  postType: StudyGroupPostType;
  content: string;
  linkUrl?: string;
  imageUrl?: string;
}

export interface CreateStudyGroupCommentRequestDTO {
  content: string;
  parentCommentId?: number;
}

export interface GetStudyGroupsResponseDTO {
  message: string;
  groups: StudyGroupDTO[];
}

export interface CreateStudyGroupResponseDTO {
  message: string;
  group: StudyGroupDTO;
}

export interface JoinStudyGroupResponseDTO {
  message: string;
  role: StudyGroupRole;
  groupId: number;
}

export interface GetStudyGroupAssignmentsResponseDTO {
  message: string;
  assignments: StudyGroupAssignmentDTO[];
}

export interface CreateStudyGroupAssignmentResponseDTO {
  message: string;
  assignment: StudyGroupAssignmentDTO;
}

export interface GetStudyGroupPostsResponseDTO {
  message: string;
  posts: StudyGroupPostDTO[];
}

export interface CreateStudyGroupPostResponseDTO {
  message: string;
  post: StudyGroupPostDTO;
}

export interface CreateStudyGroupCommentResponseDTO {
  message: string;
  comment: Omit<StudyGroupCommentDTO, 'replies'>;
}
