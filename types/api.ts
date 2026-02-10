
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
} from './dtos';




// Auth
export type RegisterRequest = RegisterRequestDTO;

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
};
