//these  types are used for form state, validation schemas, and user input
 




export interface CardAddFormValues {
  title: string;
  targetLanguage: string;
  description: string;
  agreed: boolean;
}




export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SignupFormValues {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}




export interface ProfileUpdateFormValues {
  username?: string;
  bio?: string;
  country?: string;
  email?: string;
}




export interface SearchFormValues {
  query: string;
  type?: 'cards' | 'users' | 'all';
}

