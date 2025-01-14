import styles from "@/styles/components/chip.module.scss";

const Chip = ({ text, textColor, bgColor, onClick }) => (
  <div
    onClick={onClick}
    className={styles.container}
    style={{
      backgroundColor: bgColor,
      padding: "0.5rem 1rem",
      border: textColor ? "none" : `1px solid #e2e2e2`,
      ...(onClick && { cursor: "pointer" }),
    }}
  >
    <p
      style={{
        color: textColor,
      }}
    >
      {text}
    </p>
  </div>
);

export default Chip;
