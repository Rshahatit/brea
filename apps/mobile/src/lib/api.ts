import { getIdToken } from './firebase';
import type {
  User,
  MatchResult,
  ArenaRunResponse,
  ConsentResponse,
  ProfileData,
  ApiError,
} from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getIdToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.message || 'API request failed');
  }

  return data as T;
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  userId: string;
  isAnonymous: boolean;
}> {
  return apiRequest('/auth/status');
}

export async function upgradeAccount(data: {
  email?: string;
  phone?: string;
}): Promise<{ success: boolean; uid: string }> {
  return apiRequest('/auth/upgrade', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// PROFILE ENDPOINTS
// ============================================================================

export async function getMe(): Promise<User> {
  return apiRequest('/me');
}

export async function updateProfile(
  data: Partial<ProfileData>
): Promise<{ success: boolean; profile: ProfileData }> {
  return apiRequest('/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function confirmHypothesis(
  claim: string,
  confirmed: boolean
): Promise<{ success: boolean }> {
  return apiRequest('/me/hypotheses/confirm', {
    method: 'POST',
    body: JSON.stringify({ claim, confirmed }),
  });
}

export async function uploadPhoto(
  photoUrl: string
): Promise<{ photoUrl: string; hypotheses: Array<{ claim: string; question: string }> }> {
  return apiRequest('/photos', {
    method: 'POST',
    body: JSON.stringify({ photoUrl }),
  });
}

// ============================================================================
// ARENA ENDPOINTS
// ============================================================================

export async function runArena(
  targetPersonaId?: string
): Promise<ArenaRunResponse> {
  return apiRequest('/arena/run', {
    method: 'POST',
    body: JSON.stringify({ targetPersonaId }),
  });
}

export async function getMatches(): Promise<{ matches: MatchResult[] }> {
  return apiRequest('/arena/matches');
}

export async function getMatch(matchId: string): Promise<MatchResult> {
  return apiRequest(`/arena/matches/${matchId}`);
}

// ============================================================================
// CONSENT ENDPOINTS
// ============================================================================

export async function submitConsent(
  matchId: string,
  action: 'APPROVE' | 'REJECT'
): Promise<ConsentResponse> {
  return apiRequest('/consent', {
    method: 'POST',
    body: JSON.stringify({ matchId, action }),
  });
}

export async function getConsentStatus(
  matchId: string
): Promise<{
  hasConsent: boolean;
  action?: 'APPROVE' | 'REJECT';
  inviteLink?: string;
  inviteExpiry?: string;
}> {
  return apiRequest(`/consent/${matchId}`);
}
