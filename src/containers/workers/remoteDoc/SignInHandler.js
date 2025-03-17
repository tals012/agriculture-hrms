"use client";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Spinner from "@/components/spinner";
import TextField from "@/components/textField";
import { validatePasswordForRemoteDocSignIn } from "@/app/(backend)/actions/workers/digitalForm/validatePasswordForRemoteDocSignIn";
import { resendPasswordForRemoteDoc } from "@/app/(backend)/actions/workers/digitalForm/resendPasswordForRemoteDoc";
import { getLanguageFromCountryCode } from "@/lib/utils/languageMappings";
import { languageTranslations } from "@/lib/utils/languageMappings";
import styles from "@/styles/containers/workers/remoteDoc/signInHandler.module.scss";

function SignInHandler({ slug, onAuthSuccess, requiresPassword, countryCode }) {
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Get language code from country code and then get translations
  const languageCode = getLanguageFromCountryCode(countryCode);
  const translations =
    languageTranslations[languageCode] || languageTranslations.en;

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (countdown === 0 && attempts >= 3) {
      setShowResend(true);
    }
  }, [countdown, attempts]);

  const handleResendCode = async () => {
    try {
      setIsResending(true);
      const res = await resendPasswordForRemoteDoc({ slug });
      if (res.ok) {
        toast.success(translations.codeSent || "New code has been sent", {
          position: "top-center",
        });
        setShowResend(false);
        setErrorMessage("");
        setPassword("");
        setAttempts(0);
        setResendCooldown(60);
      } else {
        toast.error(res.message, {
          position: "top-center",
        });
      }
    } catch (e) {
      toast.error(translations.error || "Error resending code", {
        position: "top-center",
      });
    } finally {
      setIsResending(false);
    }
  };

  const onValidatePassword = async () => {
    try {
      setIsAuthenticating(true);
      const res = await validatePasswordForRemoteDocSignIn({ slug, password });
      if (res.ok) {
        onAuthSuccess();
      } else {
        setAttempts((prev) => prev + 1);
        setErrorMessage(
          res.message || translations.invalidCode || "Invalid code"
        );
        setPassword("");
        // Only show resend option after 3 attempts
        if (attempts >= 2) {
          setCountdown(30);
        }
      }
    } catch (e) {
      toast.error(translations.error || "Error validating code", {
        position: "top-center",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1>{translations.verifyAccount}</h1>
        </div>
        <div className={styles.formContainer}>
          <p className={styles.description}>{translations.enterPassword}</p>

          <TextField
            label={translations.password}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errorMessage}
            disabled={isAuthenticating || isResending}
          />

          {errorMessage && (
            <div className={styles.errorMessage}>
              {errorMessage}
              {countdown > 0 && attempts >= 3 && (
                <div className={styles.countdown}>
                  {translations.tryAgainIn || "Try again in"} {countdown}{" "}
                  {translations.seconds || "seconds"}
                </div>
              )}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.submitButton}
              disabled={isAuthenticating || isResending || !password}
              onClick={onValidatePassword}
            >
              {isAuthenticating ? (
                <Spinner size={20} color="white" />
              ) : (
                translations.submit
              )}
            </button>

            {showResend && (
              <div>
                <button
                  type="button"
                  className={styles.resendButton}
                  disabled={isResending || isAuthenticating || resendCooldown > 0}
                  onClick={handleResendCode}
                >
                  {isResending ? (
                    <Spinner size={20} color="#2196f3" />
                  ) : resendCooldown > 0 ? (
                    `${translations.resendCode || "Resend Code"} (${resendCooldown}s)`
                  ) : (
                    translations.resendCode || "Resend Code"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInHandler;
