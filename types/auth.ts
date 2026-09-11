export interface InvestigatorUser {
  id: string;
  name: string;
  badgeId: string;
  role: string;
  department: string;
  station: string;
  avatarInitials: string;
  email: string;
  lastLogin?: string;
}

export interface AuthState {
  user: InvestigatorUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
