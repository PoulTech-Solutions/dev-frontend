import { isProductionBuild } from "../utils/runtime";

/** Avoid leaking tokens, OTPs, or PII in production console output. */
export function logClientError(context: string, error: unknown): void {
  if (isProductionBuild) {
    console.error(context);
    return;
  }
  console.error(context, error);
}