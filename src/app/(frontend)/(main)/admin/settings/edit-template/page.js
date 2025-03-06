import EditTemplate from "@/containers/screens/settings/templateDocument/edit-template/editTemplate";
import styles from "@/styles/screens/editTemplate.module.scss";

export const metadata = {
  title: "Edit Template | Agriculture HRMS",
};

export default function EditTemplatePage({ searchParams }) {
  const link = searchParams?.link;

  if (!link) {
    return (
      <div className={styles.errorContainer}>
        <h3>Missing Template Link</h3>
        <p>Cannot edit the template without a valid link parameter.</p>
        <a href="/admin/settings?tab=documents" className={styles.backButton}>
          Back to Settings
        </a>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.main}>
          <div className={styles.mainWrapper}>
            <EditTemplate />
          </div>
        </div>
      </div>
    </div>
  );
} 