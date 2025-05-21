import styles from "@/styles/components/progressBar.module.scss";

const ProgressBar = ({ progress = 0 }) => {
  return (
    <div className={styles.progressBar}>
      <div className={styles.fill} style={{ width: `${progress}%` }} />
    </div>
  );
};

export default ProgressBar;
