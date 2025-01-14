import Card from "@/containers/login/card";
import { ToastContainer } from "react-toastify";
import styles from "@/styles/screens/login.module.scss";

export default async function Login() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <Card />
      </div>

      <ToastContainer />
    </div>
  );
}
