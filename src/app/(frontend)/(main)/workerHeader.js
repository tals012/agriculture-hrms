"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCookie } from "@/lib/getCookie";
import styles from "@/styles/layout/header.module.scss";

export default function WorkerHeader() {
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
      <div className={styles.wrapper} style={{ justifyContent: "space-between" }}>
        <div className={styles.right}>
          <Link href="/worker/attendance">
            <Image
              src="/assets/icons/logowave.png"
              alt="logo"
              width={130}
              height={50}
              className={styles.logo}
            />
          </Link>
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
