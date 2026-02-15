import { getValidAccessToken } from "@/lib/google-oauth";

const CALENDAR_BASE_URL = "https://www.googleapis.com/calendar/v3";

export async function googleCalendarFetch(
  serviceConnectionId: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const accessToken = await getValidAccessToken(serviceConnectionId);

  const res = await fetch(`${CALENDAR_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${text}`);
  }

  // DELETE returns 204 No Content
  if (res.status === 204) {
    return { success: true };
  }

  return res.json();
}
