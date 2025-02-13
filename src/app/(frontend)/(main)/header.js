"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import getProfile from "@/app/(backend)/actions/auth/getProfile";
import { getCookie } from "@/lib/getCookie";
import styles from "@/styles/layout/header.module.scss";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropOpen, setIsDropOpen] = useState(false);
  const handleLogout = () => {
    document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  // * fetch logged in user details
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = getCookie("token");
      const { data } = await getProfile({ token });
      setRole(data.role);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return;
  }

  return (
    <header className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.right}>
          <Link href="/home">
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
              <Link href="/home">
                <li className={pathname === "/home" ? styles.active : ""}>
                  ראשי
                </li>
              </Link>

              <Link href="/admin/clients">
                <li
                  className={pathname === "/admin/clients" ? styles.active : ""}
                >
                  לקוחות
                </li>
              </Link>

              <Link href="/admin/workers">
                <li
                  className={pathname === "/admin/workers" ? styles.active : ""}
                >
                  עובדים
                </li>
              </Link>

              {/* <Link href="/admin/users">
                <li
                  className={pathname === "/admin/users" ? styles.active : ""}
                >
                  משתמשים
                </li>
              </Link> */}

              <Link href="/admin/settings">
                <li
                  className={
                    pathname === "/admin/settings" ? styles.active : ""
                  }
                >
                  הגדרות
                </li>
              </Link>
              <Link href="/admin/groups">
                <li
                  className={pathname === "/admin/groups" ? styles.active : ""}
                >
                  קבוצות
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
};

export default Header;
