import styles from "@/styles/components/spinner.module.scss";

const Spinner = ({ size = 20, color = "#3498db" }) => (
  <div
    className={styles.container}
    style={{
      width: size,
      height: size,
      borderWidth: size * (1 / 8),
      borderRightColor: color,
      borderTopColor: color,
    }}
  ></div>
);

export default Spinner;
