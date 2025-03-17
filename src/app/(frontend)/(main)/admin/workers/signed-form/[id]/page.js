import { Suspense } from "react";
import Spinner from "@/components/spinner";
import Form from "@/containers/signedForm/form";
import styles from "@/styles/screens/signed-form.module.scss";

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
    </div>
  );
}
