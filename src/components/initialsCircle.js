import { getInitials } from "@/lib/getInitials";
import styles from "@/styles/components/initialsCircle.module.scss";

const InitialsCircle = ({
  name,
  width,
  height,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textAlign,
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
