"use client";

import React from "react";
import styles from "@/styles/screens/thank-you.module.scss";
import { useRouter } from "next/navigation";

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>תודה רבה!</h1>
        <p className={styles.message}>
          המסמך שלך הוגש בהצלחה. אתה יכול לסגור חלון זה כעת.
        </p>
        <div className={styles.iconWrapper}>
          <svg 
            className={styles.checkIcon}
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
