import Card from "@/containers/login/card";
import { ToastContainer } from "react-toastify";
import styles from "@/styles/screens/login.module.scss";
import { Suspense } from "react";

export default function Login() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <Suspense fallback={<div>Loading...</div>}>
          <Card />
        </Suspense>
      </div>

      <ToastContainer />
    </div>
  );
}
