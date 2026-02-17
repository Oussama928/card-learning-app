
import type {
  RegisterRequestDTO,
  CreateCardRequestDTO,
  CardResponseDTO,
  CardWithOwnerDTO,
  CardDetailResponseDTO,
  GetCardsResponseDTO,
  CreateWordProgressRequestDTO,
  ProgressItemDTO,
  GetProgressResponseDTO,
  PostProgressResponseDTO,
  UserStatsDTO,
  GetStatsResponseDTO,
  GlobalStatsDTO,
  GetGlobalStatsResponseDTO,
  UpdateStreakResponseDTO,
  NotificationItemDTO,
  CreateNotificationRequestDTO,
  GetNotificationsResponseDTO,
  DeleteNotificationResponseDTO,
  HandleFavoritesRequestDTO,
  FavoritesResponseDTO,
  HandleFavoritesResponseDTO,
  SearchQueryDTO,
  SearchResultDTO,
  SearchResponseDTO,
  UpdateProfileRequestDTO,
  UpdateProfileResponseDTO,
  AddCardResponseDTO,
  ApiSuccessResponseDTO,
  ApiErrorResponseDTO,
  ApiResponseDTO,
  PaginationDTO,
  NotificationType,
  SignupResponseDTO,
  VerifyEmailRequestDTO,
  VerifyEmailResponseDTO,
  ResendOtpRequestDTO,
  ResendOtpResponseDTO,
  ForgotPasswordRequestDTO,
  ForgotPasswordResponseDTO,
  ResetPasswordRequestDTO,
  ResetPasswordResponseDTO,
  HomeOverviewDTO,
  StudyGroupDTO,
  CreateStudyGroupRequestDTO,
  JoinStudyGroupRequestDTO,
  StudyGroupAssignmentDTO,
  CreateStudyGroupAssignmentRequestDTO,
  StudyGroupPostDTO,
  StudyGroupCommentDTO,
  CreateStudyGroupPostRequestDTO,
  CreateStudyGroupCommentRequestDTO,
} from './dtos';




// Auth
export type RegisterRequest = RegisterRequestDTO;
export type SignupResponse = SignupResponseDTO;
export type VerifyEmailRequest = VerifyEmailRequestDTO;
export type VerifyEmailResponse = VerifyEmailResponseDTO;
export type ResendOtpRequest = ResendOtpRequestDTO;
export type ResendOtpResponse = ResendOtpResponseDTO;
export type ForgotPasswordRequest = ForgotPasswordRequestDTO;
export type ForgotPasswordResponse = ForgotPasswordResponseDTO;
export type ResetPasswordRequest = ResetPasswordRequestDTO;
export type ResetPasswordResponse = ResetPasswordResponseDTO;

// Card Operations
export type AddCardRequest = CreateCardRequestDTO;
export type AddCardResponse = AddCardResponseDTO;
export type GetCardResponse = CardDetailResponseDTO;
export type GetCardsResponse = GetCardsResponseDTO;

// Progress & Stats
export type UpdateProgressRequest = CreateWordProgressRequestDTO;
export type GetProgressResponse = GetProgressResponseDTO;
export type PostProgressResponse = PostProgressResponseDTO;
export type GetStatsResponse = GetStatsResponseDTO;

// Notifications
export type NotificationResponse = GetNotificationsResponseDTO;
export type DeleteNotificationResponse = DeleteNotificationResponseDTO;

// Favorites
export type HandleFavoritesRequest = HandleFavoritesRequestDTO;
export type HandleFavoritesResponse = HandleFavoritesResponseDTO;

// Search
export type SearchRequest = SearchQueryDTO;
export type SearchResponse = SearchResponseDTO;

// Profile
export type UpdateProfileRequest = UpdateProfileRequestDTO;
export type UpdateProfileResponse = UpdateProfileResponseDTO;

// Home
export type HomeOverviewResponse = HomeOverviewDTO;

// Study Groups
export type StudyGroup = StudyGroupDTO;
export type CreateStudyGroupRequest = CreateStudyGroupRequestDTO;
export type JoinStudyGroupRequest = JoinStudyGroupRequestDTO;
export type StudyGroupAssignment = StudyGroupAssignmentDTO;
export type CreateStudyGroupAssignmentRequest = CreateStudyGroupAssignmentRequestDTO;
export type StudyGroupPost = StudyGroupPostDTO;
export type StudyGroupComment = StudyGroupCommentDTO;
export type CreateStudyGroupPostRequest = CreateStudyGroupPostRequestDTO;
export type CreateStudyGroupCommentRequest = CreateStudyGroupCommentRequestDTO;

// Generic
export type ApiSuccess<T = any> = ApiSuccessResponseDTO<T>;
export type ApiError = ApiErrorResponseDTO;
export type ApiResponse<T = any> = ApiResponseDTO<T>;
export type Pagination = PaginationDTO;
export type NotificationTypeAlias = NotificationType;




export type {
  RegisterRequestDTO,
  CreateCardRequestDTO,
  CardResponseDTO,
  CardWithOwnerDTO,
  CardDetailResponseDTO,
  GetCardsResponseDTO,
  CreateWordProgressRequestDTO,
  ProgressItemDTO,
  GetProgressResponseDTO,
  PostProgressResponseDTO,
  UserStatsDTO,
  GetStatsResponseDTO,
  GlobalStatsDTO,
  GetGlobalStatsResponseDTO,
  UpdateStreakResponseDTO,
  NotificationItemDTO,
  CreateNotificationRequestDTO,
  GetNotificationsResponseDTO,
  DeleteNotificationResponseDTO,
  HandleFavoritesRequestDTO,
  FavoritesResponseDTO,
  HandleFavoritesResponseDTO,
  SearchQueryDTO,
  SearchResultDTO,
  SearchResponseDTO,
  UpdateProfileRequestDTO,
  UpdateProfileResponseDTO,
  AddCardResponseDTO,
  ApiSuccessResponseDTO,
  ApiErrorResponseDTO,
  ApiResponseDTO,
  PaginationDTO,
  NotificationType,
  SignupResponseDTO,
  VerifyEmailRequestDTO,
  VerifyEmailResponseDTO,
  ResendOtpRequestDTO,
  ResendOtpResponseDTO,
  ForgotPasswordRequestDTO,
  ForgotPasswordResponseDTO,
  ResetPasswordRequestDTO,
  ResetPasswordResponseDTO,
  HomeOverviewDTO,
  StudyGroupDTO,
  CreateStudyGroupRequestDTO,
  JoinStudyGroupRequestDTO,
  StudyGroupAssignmentDTO,
  CreateStudyGroupAssignmentRequestDTO,
  StudyGroupPostDTO,
  StudyGroupCommentDTO,
  CreateStudyGroupPostRequestDTO,
  CreateStudyGroupCommentRequestDTO,
};
