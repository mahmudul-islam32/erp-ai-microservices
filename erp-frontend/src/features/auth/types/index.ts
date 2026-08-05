export interface User {
  id: string;
  /**
   * Raw Mongo identifier. Some endpoints serialise by alias and return `_id`
   * rather than `id`, so call sites read `user.id || user._id`.
   */
  _id?: string;
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
  two_factor_enabled?: boolean;
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
  requires2FASetup?: boolean;
}


/** Returned by the login endpoint when the account has 2FA enabled. */
export interface TwoFactorRequiredResponse {
  requires_2fa: boolean;
  email: string;
  message: string;
}

export type LoginResult = LoginResponse | TwoFactorRequiredResponse;

/** Narrows a login result to the 2FA challenge branch. */
export const isTwoFactorRequired = (
  result: LoginResult
): result is TwoFactorRequiredResponse =>
  'requires_2fa' in result && Boolean(result.requires_2fa);
