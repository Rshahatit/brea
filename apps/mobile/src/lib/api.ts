import type {
  GetMeResponse,
  RunArenaResponse,
  LogConsentRequest,
  LogConsentResponse,
  ApiError,
} from "@brea/shared";
import { getAuthToken } from "./firebase";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || "API request failed");
    }

    return response.json();
  }

  // Profile
  async getMe(): Promise<GetMeResponse> {
    return this.request<GetMeResponse>("/me");
  }

  // Arena
  async runArena(targetPersonaId?: string): Promise<RunArenaResponse> {
    return this.request<RunArenaResponse>("/arena/run", {
      method: "POST",
      body: JSON.stringify({ targetPersonaId }),
    });
  }

  // Consent
  async logConsent(data: LogConsentRequest): Promise<LogConsentResponse> {
    return this.request<LogConsentResponse>("/consent", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Health check
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request("/health");
  }
}

export const api = new ApiClient();
