import { useCallback, useEffect, useState } from "react";

const DEFAULT_RESEND_SECONDS = 60;

/** Countdown for POST /auth/resend-otp (backend `resend_after` on challenges). */
export function useOtpResendCooldown(defaultSeconds = DEFAULT_RESEND_SECONDS) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const startFromChallenge = useCallback(
    (resendAfter?: number) => {
      const wait = resendAfter ?? defaultSeconds;
      if (wait > 0) setSecondsLeft(wait);
    },
    [defaultSeconds],
  );

  const resetCooldown = useCallback(() => setSecondsLeft(0), []);

  return {
    secondsLeft,
    canResend: secondsLeft <= 0,
    startFromChallenge,
    resetCooldown,
  };
}