"use client";
import Personal from "@/containers/bigModals/client/general/personal";
import styles from "@/styles/bigModals/client/tabs/general.module.scss";

const General = ({ personalData, setPersonalData }) => {
  return (
    <div className={styles.container}>
      <h1>פרטי לקוח</h1>
      <Personal personalData={personalData} setPersonalData={setPersonalData} />
    </div>
  );
};

export default General;
