export type Severity = "High" | "Med" | "Low";

export interface ParsedIncident {
  Severity: Severity;
  Component: string;
  Timestamp: string;
  Suspected_Cause: string;
  Impact_Count: number;
}

export interface ParseIncidentResponse {
  success: boolean;
  data?: ParsedIncident;
  error?: string;
}

