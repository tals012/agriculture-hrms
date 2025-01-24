"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCookie } from "@/lib/getCookie";
import styles from "@/styles/layout/header.module.scss";

export default function GroupLeaderHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState(null);
  const [isDropOpen, setIsDropOpen] = useState(false);

  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      router.push("/login");
    }
    setToken(token);
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };

  if (!token) return null;

  return (
    <header className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.right}>
          <Link href="/group-leader/my-group">
            <Image
              src="/assets/icons/logowave.png"
              alt="logo"
              width={130}
              height={50}
              className={styles.logo}
            />
          </Link>
          <nav>
            <ul className={styles.ulDesktop}>
              <Link href="/group-leader/my-group">
                <li
                  className={
                    pathname === "/group-leader/my-group" ? styles.active : ""
                  }
                >
                  הקבוצה שלי
                </li>
              </Link>
              <Link href="/group-leader/attendance">
                <li
                  className={
                    pathname === "/group-leader/attendance" ? styles.active : ""
                  }
                >
                  נוכחות
                </li>
              </Link>
            </ul>
          </nav>
        </div>

        <div className={styles.left}>
          <div
            className={styles.user}
            onClick={() => setIsDropOpen(!isDropOpen)}
          >
            <Image
              src="/assets/icons/menu-1.svg"
              alt="menu-icon"
              width={24}
              height={24}
            />
            <Image
              src="/assets/icons/user-1.jpg"
              alt="avatar"
              width={32}
              height={32}
              className={styles.avatar}
            />

            {isDropOpen && (
              <div className={styles.userDrop} onClick={handleLogout}>
                <p>התנתקות</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
