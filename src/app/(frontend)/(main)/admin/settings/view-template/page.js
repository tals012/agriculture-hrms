import TemplateViewer from "@/containers/screens/settings/viewTemplate/TemplateViewer";
import styles from "@/styles/screens/viewTemplate.module.scss";

export const metadata = {
  title: "View Template | Agriculture HRMS",
};

export default function ViewTemplate({ searchParams }) {
  const link = searchParams?.link;

  if (!link) {
    return (
      <div className={styles.errorContainer}>
        <h3>Missing Template Link</h3>
        <p>Cannot view the template without a valid link parameter.</p>
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
            <TemplateViewer link={link} />
          </div>
        </div>
      </div>
    </div>
  );
} 