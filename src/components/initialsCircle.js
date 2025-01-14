import { getInitials } from "@/lib/getInitials";
import styles from "@/styles/components/initialsCircle.module.scss";

const InitialsCircle = ({ name }) => {
  return (
    <div className={styles.container}>
      <p>{getInitials(name)}</p>
    </div>
  );
};

export default InitialsCircle;
