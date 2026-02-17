//these types are used for typing React component properties

import type { CardWithOwnerDTO } from './dtos';




export interface CardProps {
  data: CardWithOwnerDTO;
  isfavorited?: boolean;
  setCards?: React.Dispatch<React.SetStateAction<CardWithOwnerDTO[] | null>>;
  delete_item?: boolean;
  setIsEditing?: React.Dispatch<React.SetStateAction<any>>;
  removeOnUnfavorite?: boolean;
}




export interface CardAddminiProps {
  index: number;
  words: Array<[string, string, (number | boolean | string)?, string?]>;
  setWords: React.Dispatch<React.SetStateAction<Array<[string, string, (number | boolean | string)?, string?]>>>;
  seti: React.Dispatch<React.SetStateAction<number>>;
  setGarbageCollector: React.Dispatch<React.SetStateAction<number[]>>;
  onUploadWordImage: (index: number, file: File) => Promise<void>;
  isUploading: boolean;
}




export interface NotificationProps {
  text: string;
  func: () => void;
  cancel: (value: boolean) => void;
  main_action: string;
}




export interface NavbarProps {
  currentPage?: string;
}




export interface ProfileInfosProps {
  userId?: string;
  isOwnProfile?: boolean;
}




export interface CardsPageProps {
  cards: CardWithOwnerDTO[];
  loading: boolean;
  error?: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


// loading component props


export interface LoadingProps {
  message?: string;
}

export interface HomeDashboardProps {
  accessToken?: string;
  userName?: string;
}


// page-levle props


export interface CardAddPageProps {
  Current?: string; //if editing 
}

export interface LearningPageProps {
  params: Promise<{
    id: string; 
  }>;
}

export interface ProfilePageProps {
  params: Promise<{
    id?: string; // User ID if viewing another profile
  }>;
}

export interface SearchPageProps {
  params: Promise<{
    query: string; // search query string
  }>;
}
