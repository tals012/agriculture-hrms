import Spinner from "@/components/spinner";
import Form from "@/containers/screens/fieldman/signedForm/Form";
import styles from "@/styles/screens/common/screen.module.scss";
import { Suspense } from "react";
// import { ToastContainer } from "react-toastify";

export default function SignedForm({ params }) {
  const { id } = params;
  if (!id) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <Suspense fallback={<Spinner />}>
          <Form foreignWorkerId={id} source={"ADMIN"} />
        </Suspense>
      </div>
      {/* <ToastContainer /> */}
    </div>
  );
}
