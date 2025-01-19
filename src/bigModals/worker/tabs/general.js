"use client";

import Personal from "@/containers/bigModals/worker/general/personal";
import styles from "@/styles/bigModals/worker/tabs/general.module.scss";

const General = ({ personalData, setPersonalData, workerId }) => {
  return (
    <div className={styles.container}>
      <h1>פרטי עובד</h1>
      <Personal personalData={personalData} setPersonalData={setPersonalData} workerId={workerId} />
    </div>
  );
};

export default General; 