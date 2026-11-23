import axios from "axios";

export function getApiErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: { code?: string } } | undefined;
    return payload?.error?.code;
  }
  return undefined;
}

export function getApiErrorMessage(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as {
      error?: { message?: string; details?: Array<{ field?: string; message?: string }> };
    } | undefined;
    const details = payload?.error?.details
      ?.map((d) => d.message)
      .filter(Boolean)
      .join(" ");
    return details || payload?.error?.message;
  }
  return undefined;
}