"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
// import { login } from "@/actions/auth/login";
import { toast } from "react-toastify";
import { getCookie } from "@/lib/getCookie";
import styles from "@/styles/containers/login/card.module.scss";

export default function Card() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

//   useEffect(() => {
//     let token = getCookie("token");
//     if (token) {
//       router.push("/home");
//     }
//   }, []);

  const handleSubmit = async (e) => {
    // e.preventDefault();

    // try {
    //   setLoading(true);
    //   const res = await login({ username, password });

    //   if (!res.ok) {
    //     return toast.error(res.message, {
    //       position: "top-center",
    //       autoClose: 3000,
    //     });
    //   } else {
    //     document.cookie = `token=${res.token}; Path=/; HttpOnly`;
    //     toast.success(res.message, {
    //       position: "top-center",
    //       autoClose: 3000,
    //     });
    //     router.push("/home");
    //   }
    // } catch (error) {
    //   console.log(error);
    // } finally {
    //   setLoading(false);
    // }
  };
  return (
    <div className={styles.container}>
      <h1>התחברות</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <input
            type="text"
            name="username"
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <input
            type="password"
            name="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <a
            className="cursor-pointer"
            onClick={() => router.push("/forgot-password")}
          >
            לשכוח סיסמה?
          </a>
        </div>

        <button type="submit">
          {loading ? <Spinner color="#ffffff" /> : "התחבר"}
        </button>
        {/* {state && !state.ok && (
          <small className={styles.error}>{state.message}</small>
        )} */}
      </form>
    </div>
  );
}
