import { getInitials } from "@/lib/getInitials";
import styles from "@/styles/components/initialsCircle.module.scss";

const InitialsCircle = ({
  name,
  width = 32,
  height = 32,
  fontSize = 15,
  fontWeight = 400,
  lineHeight = 24,
  letterSpacing = -0.15,
  textAlign = "center",
}) => {
  return (
    <div
      className={styles.container}
      style={{
        width,
        height,
      }}
    >
      <p
        style={{
          fontSize,
          fontWeight,
          lineHeight,
          letterSpacing,
          textAlign,
        }}
      >
        {getInitials(name)}
      </p>
    </div>
  );
};

export default InitialsCircle;
