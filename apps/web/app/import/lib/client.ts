interface ActivityData {
  steps: number;
  calories_total: number;
  distance_meter: number;
  date: string;
}

interface SleepData {
  duration_seconds: number;
  deep_seconds: number;
  rem_seconds: number;
  date: string;
}

interface ConnectTokenResponse {
  connect_link: string;
}

interface ApiResponse<T> {
  data: T[];
}

export class Client {
  private baseUrl = '/api/import';

  async getConnectToken(userId: string): Promise<ConnectTokenResponse> {
    const response = await fetch(`${this.baseUrl}/connect/${userId}`);
    return response.json();
  }

  async getActivity(userId: string): Promise<ApiResponse<ActivityData>> {
    const response = await fetch(`${this.baseUrl}/activity/${userId}`);
    return response.json();
  }

  async getSleep(userId: string): Promise<ApiResponse<SleepData>> {
    const response = await fetch(`${this.baseUrl}/sleep/${userId}`);
    return response.json();
  }
}

export const fetcher = (url: string) => 
  fetch(`/api/import${url}`).then((res) => res.json()); 