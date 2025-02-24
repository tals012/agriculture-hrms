"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import ReactSelect from "react-select";
import { toast } from "react-toastify";
import TextField from "@/components/textField";
import styles from "@/styles/containers/schedule-builder/sideBox.module.scss";
import getWorkers from "@/app/(backend)/actions/workers/getWorkers";
import getClients from "@/app/(backend)/actions/clients/getClients";
import getGroups from "@/app/(backend)/actions/groups/getGroups";
import generateSchedule from "@/app/(backend)/actions/schedule/generateSchedule";
import Spinner from "@/components/spinner";

const createSelectStyle = (zIndex) => ({
  control: (baseStyles, state) => ({
    ...baseStyles,
    width: "100%",
    border: "1px solid #E6E6E6",
    height: "44px",
    fontSize: "14px",
    color: "#999FA5",
    borderRadius: "6px",
    background: "transparent",
    zIndex,
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: zIndex + 1,
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: zIndex + 1,
  }),
});

const clientSelectStyle = createSelectStyle(3);
const groupSelectStyle = createSelectStyle(2);
const workerSelectStyle = createSelectStyle(1);

const SideBox = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    numberOfTotalHoursPerDay: "8",
    numberOfTotalDaysPerWeek: "6",
    startTimeInMinutes: "480",
    breakTimeInMinutes: "30",
    isBreakTimePaid: false,
    isBonusPaid: false,
    selectedClient: null,
    selectedGroup: null,
    selectedWorker: null,
  });

  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState({
    clients: false,
    groups: false,
    workers: false,
    generate: false,
  });

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      setLoading((prev) => ({ ...prev, clients: true }));
      try {
        const response = await getClients();
        if (response.status === 200) {
          setClients(
            response.data.map((client) => ({
              value: client.id,
              label: client.name,
              data: client,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading((prev) => ({ ...prev, clients: false }));
      }
    };

    fetchClients();
  }, []);

  // Fetch groups when client is selected
  useEffect(() => {
    const fetchGroups = async () => {
      if (!formData.selectedClient) {
        setGroups([]);
        return;
      }

      setLoading((prev) => ({ ...prev, groups: true }));
      try {
        const response = await getGroups({
          clientId: formData.selectedClient.value,
        });
        if (response.status === 200) {
          setGroups(
            response.data.map((group) => ({
              value: group.id,
              label: group.name,
              data: group,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading((prev) => ({ ...prev, groups: false }));
      }
    };

    fetchGroups();
  }, [formData.selectedClient]);

  // Fetch workers when client is selected
  useEffect(() => {
    const fetchWorkers = async () => {
      if (!formData.selectedClient) {
        setWorkers([]);
        return;
      }

      setLoading((prev) => ({ ...prev, workers: true }));
      try {
        const response = await getWorkers({
          clientId: formData.selectedClient.value,
        });
        if (response.status === 200) {
          setWorkers(
            response.data.map((worker) => ({
              value: worker.id,
              label: `${worker.nameHe} ${worker.surnameHe || ""}`.trim(),
              data: worker,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching workers:", error);
      } finally {
        setLoading((prev) => ({ ...prev, workers: false }));
      }
    };

    fetchWorkers();
  }, [formData.selectedClient]);

  const handleChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleBreakTimeCheckboxChange = (e) => {
    if (e.target.checked) {
      setFormData({ ...formData, isBreakTimePaid: true });
    } else {
      setFormData({ ...formData, isBreakTimePaid: false });
    }
  };

  const handleBonusCheckboxChange = (e) => {
    if (e.target.checked) {
      setFormData({ ...formData, isBonusPaid: true });
    } else {
      setFormData({ ...formData, isBonusPaid: false });
    }
  };

  const handleClientChange = (option) => {
    setFormData({
      ...formData,
      selectedClient: option,
      selectedGroup: null,
      selectedWorker: null,
    });
  };

  const handleGenerate = async () => {
    try {
      setLoading((prev) => ({ ...prev, generate: true }));

      const payload = {
        numberOfTotalHoursPerDay: parseFloat(formData.numberOfTotalHoursPerDay),
        numberOfTotalDaysPerWeek: parseFloat(formData.numberOfTotalDaysPerWeek),
        startTimeInMinutes: parseFloat(formData.startTimeInMinutes),
        breakTimeInMinutes: parseFloat(formData.breakTimeInMinutes),
        isBreakTimePaid: formData.isBreakTimePaid,
        isBonusPaid: formData.isBonusPaid,
        ...(formData.selectedClient && {
          clientId: formData.selectedClient.value,
        }),
        ...(formData.selectedGroup && {
          groupId: formData.selectedGroup.value,
        }),
        ...(formData.selectedWorker && {
          workerId: formData.selectedWorker.value,
        }),
      };

      const response = await generateSchedule(payload);

      if (response.status === 200) {
        toast.success(response.message, {
          position: "top-center",
          autoClose: 3000,
        });
        // Optionally redirect or refresh data
      } else {
        toast.error("שגיאה ביצירת לוח הזמנים", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast.error("שגיאה ביצירת לוח הזמנים", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading((prev) => ({ ...prev, generate: false }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.items}>
        <div className={styles.formGroup}>
          <TextField
            label="שעות עבודה ליום"
            width="100%"
            value={formData.numberOfTotalHoursPerDay}
            onChange={(e) => handleChange(e, "numberOfTotalHoursPerDay")}
            type="number"
          />
        </div>

        <div className={styles.formGroup}>
          <TextField
            label="ימי עבודה בשבוע"
            width="100%"
            value={formData.numberOfTotalDaysPerWeek}
            onChange={(e) => handleChange(e, "numberOfTotalDaysPerWeek")}
            type="number"
          />
        </div>

        <div className={styles.formGroup}>
          <TextField
            label=""
            width="100%"
            value={formData.startTimeInMinutes}
            onChange={(e) => handleChange(e, "startTimeInMinutes")}
            type="number"
            placeholder="שעת התחלה (בדקות) - לדוגמה: 480 (8:00)"
          />
        </div>

        <div className={styles.formGroup}>
          <TextField
            label="זמן הפסקה (דקות)"
            width="100%"
            value={formData.breakTimeInMinutes}
            onChange={(e) => handleChange(e, "breakTimeInMinutes")}
            type="number"
          />
        </div>

        <div className={styles.checkboxGroup}>
          <label>
            <input
              type="checkbox"
              checked={formData.isBreakTimePaid}
              onChange={handleBreakTimeCheckboxChange}
            />
            <span>הפסקה בתשלום</span>
          </label>
        </div>

        <div className={styles.checkboxGroup}>
          <label>
            <input
              type="checkbox"
              checked={formData.isBonusPaid}
              onChange={handleBonusCheckboxChange}
            />
            <span>הזינוק בתשלום</span>
          </label>
        </div>

        <div className={styles.formGroup}>
          <ReactSelect
            options={clients}
            isLoading={loading.clients}
            components={{
              IndicatorSeparator: () => null,
            }}
            placeholder="בחר לקוח"
            value={formData.selectedClient}
            onChange={handleClientChange}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
            styles={clientSelectStyle}
          />
        </div>

        <div className={styles.formGroup}>
          <ReactSelect
            options={groups}
            isLoading={loading.groups}
            isDisabled={!formData.selectedClient}
            components={{
              IndicatorSeparator: () => null,
            }}
            placeholder="בחר קבוצה"
            value={formData.selectedGroup}
            onChange={(option) =>
              setFormData({ ...formData, selectedGroup: option })
            }
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
            styles={groupSelectStyle}
          />
        </div>

        <div className={styles.formGroup}>
          <ReactSelect
            options={workers}
            isLoading={loading.workers}
            isDisabled={!formData.selectedClient}
            components={{
              IndicatorSeparator: () => null,
            }}
            placeholder="בחר עובד"
            value={formData.selectedWorker}
            onChange={(option) =>
              setFormData({ ...formData, selectedWorker: option })
            }
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
            styles={workerSelectStyle}
          />
        </div>

        <button
          className={styles.generateButton}
          onClick={handleGenerate}
          disabled={loading.generate}
        >
          {loading.generate ? <Spinner color="#ffffff" /> : "צור"}
        </button>
      </div>
    </div>
  );
};

export default SideBox;
