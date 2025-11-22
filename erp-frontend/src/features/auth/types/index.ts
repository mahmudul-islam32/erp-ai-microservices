export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string; // Computed from first_name + last_name
  phone?: string;
  department?: string;
  role: string;
  status: string;
  permissions: string[];
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

