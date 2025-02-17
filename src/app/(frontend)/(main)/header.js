"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import getProfile from "@/app/(backend)/actions/auth/getProfile";
import { getCookie } from "@/lib/getCookie";
import styles from "@/styles/layout/header.module.scss";
import InitialsCircle from "@/components/initialsCircle";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropOpen, setIsDropOpen] = useState(false);
  const handleLogout = () => {
    document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "userId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  // * fetch logged in user details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getCookie("token");
        console.log("Token from cookie:", token); // Debug token

        if (!token) {
          console.log("No token found, redirecting to login");
          router.push("/login");
          return;
        }

        console.log("Calling getProfile with token");
        const response = await getProfile({ token });
        console.log("getProfile response:", response);

        if (response?.status === 200 && response?.data) {
          console.log("Setting user data:", response.data);
          setRole(response.data.role);
          setName(response.data.name);
        } else {
          console.log("Invalid response:", response);
          router.push("/login");
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]); // Add router to dependencies

  if (loading) {
    return (
      <header className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.right}>
            <Image
              src="/assets/icons/logowave.png"
              alt="logo"
              width={130}
              height={50}
              className={styles.logo}
            />
          </div>
        </div>
      </header>
    );
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
              {/* <Link href="/home">
                <li className={pathname === "/home" ? styles.active : ""}>
                  ראשי
                </li>
              </Link> */}

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

              <Link href="/admin/groups">
                <li
                  className={pathname === "/admin/groups" ? styles.active : ""}
                >
                  קבוצות
                </li>
              </Link>

              <Link href="/admin/schedule-builder">
                <li
                  className={
                    pathname === "/admin/schedule-builder" ? styles.active : ""
                  }
                >
                  בנאי תיאורית
                </li>
              </Link>

              <Link href="/admin/working-hours">
                <li
                  className={
                    pathname === "/admin/working-hours" ? styles.active : ""
                  }
                >
                  שעות עבודה
                </li>
              </Link>

              <Link href="/admin/salary">
                <li
                  className={pathname === "/admin/salary" ? styles.active : ""}
                >
                  שכר
                </li>
              </Link>

              <Link href="/admin/settings">
                <li
                  className={
                    pathname === "/admin/settings" ? styles.active : ""
                  }
                >
                  הגדרות
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
            {/* <Image
              src="/assets/icons/user-1.jpg"
              alt="avatar"
              width={32}
              height={32}
              className={styles.avatar}
            /> */}

            <InitialsCircle
              name={name}
              width={32}
              height={32}
              fontSize={15}
              fontWeight={400}
              lineHeight={24}
              letterSpacing={-0.15}
              textAlign="center"
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
