"use client";

import { useState, useEffect } from "react";
import { Tabs, Button, message } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import PersonalTab from "@/containers/bigModals/worker/general/tabs/personalTab";
import AddressTab from "@/containers/bigModals/worker/general/tabs/addressTab";
import BankTab from "@/containers/bigModals/worker/general/tabs/bankTab";
import styles from "@/styles/bigModals/worker/tabs/general.module.scss";
import getCities from "@/app/(backend)/actions/misc/getCities";
import getCountries from "@/app/(backend)/actions/misc/getCountries";
import { getBanks } from "@/app/(backend)/actions/bank/getBanks";
import { getBranches } from "@/app/(backend)/actions/branch/getBranches";
import updateWorker from "@/app/(backend)/actions/workers/updateWorker";

const General = ({ personalData, setPersonalData, workerId }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState(null);
  const [countries, setCountries] = useState(null);
  const [banks, setBanks] = useState(null);
  const [branches, setBranches] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesRes, countriesRes, banksRes, branchesRes] =
          await Promise.all([
            getCities(),
            getCountries(),
            getBanks(),
            getBranches(),
          ]);

        if (citiesRes.status === 200) {
          setCities(citiesRes.data);
        }
        if (countriesRes.status === 200) {
          setCountries(countriesRes.data);
        }
        if (banksRes.status === 200) {
          setBanks(banksRes.data);
        }
        if (branchesRes.status === 200) {
          setBranches(branchesRes.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch("/api/salary/register-worker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workerId }),
      });

      if (response.ok) {
        message.success({
          content: "סונכרן עם מערכת השכר בהצלחה",
          duration: 4,
          style: { marginTop: "20px" },
        });
      } else {
        message.error({
          content: "נכשל בסנכרון עם מערכת השכר",
          duration: 4,
          style: { marginTop: "20px" },
        });
      }
    } catch (error) {
      message.error({
        content: "נכשל בסנכרון עם מערכת השכר: שגיאת תקשורת",
        duration: 4,
        style: { marginTop: "20px" },
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const res = await updateWorker({
        payload: {
          ...personalData,
          workerId: personalData.id,
        },
      });

      const { message: responseMessage, status } = res;

      if (status === 200) {
        message.success({
          content: responseMessage || "פרטי העובד נשמרו בהצלחה",
          duration: 4,
          style: { marginTop: "20px" },
        });
      } else if (status === 400) {
        message.error({
          content: responseMessage || "שגיאה בשמירת פרטי העובד",
          duration: 4,
          style: { marginTop: "20px" },
        });
      } else {
        message.error({
          content: responseMessage || "שגיאה לא צפויה. נסה שנית מאוחר יותר",
          duration: 4,
          style: { marginTop: "20px" },
        });
      }
    } catch (error) {
      console.log(error);
      message.error({
        content: "שגיאת שרת. אנא נסה שנית מאוחר יותר",
        duration: 4,
        style: { marginTop: "20px" },
      });
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: "1",
      label: "פרטים אישיים",
      children: (
        <PersonalTab
          personalData={personalData}
          setPersonalData={setPersonalData}
        />
      ),
    },
    {
      key: "2",
      label: "כתובת",
      children: (
        <AddressTab
          personalData={personalData}
          setPersonalData={setPersonalData}
          countries={countries}
          cities={cities}
        />
      ),
    },
    {
      key: "3",
      label: "פרטי בנק",
      children: (
        <BankTab
          personalData={personalData}
          setPersonalData={setPersonalData}
          banks={banks}
          branches={branches}
        />
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <h1>פרטי עובד</h1>
        <Button
          type="primary"
          icon={<SyncOutlined spin={isSyncing} />}
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? "מסנכרן..." : "סנכרן עם מערכת השכר"}
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        className={styles.workerTabs}
        type="line"
      />

      <div className={styles.btns}>
        <Button>ביטול</Button>
        <Button type="primary" loading={loading} onClick={handleUpdate}>
          לשמור שינויים
        </Button>
      </div>
    </div>
  );
};

export default General;
