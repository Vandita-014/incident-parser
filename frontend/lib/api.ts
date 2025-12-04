import type { ParseIncidentResponse } from "@/types/incident";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function parseIncident(
  text: string
): Promise<ParseIncidentResponse> {
  try {
    const response = await fetch(`${API_URL}/api/parse-incident`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail || `HTTP error! status: ${response.status}`,
      };
    }

    const data: ParseIncidentResponse = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to API. Make sure the backend is running on port 8000.",
    };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

