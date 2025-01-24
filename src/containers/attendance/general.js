"use client";
import { useState } from "react";
import styles from "@/styles/containers/attendance/general.module.scss";
import TextField from "@/components/textField";
import ReactSelect from "react-select";
import DatePicker from "react-datepicker";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import Image from "next/image";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { BsArrowLeft } from "react-icons/bs";

const selectStyle = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    width: "100%",
    border: "1px solid #E6E6E6",
    height: "44px",
    fontSize: "14px",
    color: "#999FA5",
    borderRadius: "6px",
    background: "transparent",
    zIndex: 999999,
  }),
  menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
  menu: (provided) => ({ ...provided, zIndex: 9999 }),
};

export default function General({ data, onUpdate, onStepChange }) {
  const [formData, setFormData] = useState({
    fullName: data?.fullName || "",
    reportDate: data?.reportDate || new Date(),
    selectedGroup: data?.selectedGroup || null,
    selectedHarvest: data?.selectedHarvest || null,
  });

  // TODO: Fetch these from your API
  const groups = [
    { value: '1', label: 'קבוצה 1' },
    { value: '2', label: 'קבוצה 2' },
  ];

  const harvestTypes = [
    { value: 'tomatoes', label: 'עגבניות' },
    { value: 'cucumbers', label: 'מלפפונים' },
    { value: 'peppers', label: 'פלפלים' },
  ];

  const handleChange = (value, field) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(newData);
  };

  const handleNext = () => {
    // Validate form
    if (!formData.fullName.trim()) {
      toast.error("נא למלא שם מלא", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
      return;
    }

    if (!formData.selectedGroup) {
      toast.error("נא לבחור קבוצה", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
      return;
    }

    if (!formData.selectedHarvest) {
      toast.error("נא לבחור סוג קטיף", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
      return;
    }

    // Move to next step
    onStepChange('workers-attendance');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>פרטים כלליים</h2>

      <div className={styles.fields}>
        <div style={{ width: "100%" }}>
          <TextField
            label="שם מלא"
            width="100%"
            value={formData.fullName}
            onChange={(e) => handleChange(e.target.value, 'fullName')}
          />
        </div>

        <div style={{ width: "100%" }}>
          <DatePicker
            selected={formData.reportDate}
            onChange={(date) => handleChange(date, 'reportDate')}
            className={styles.datepicker}
            wrapperClassName={styles.dateWrapper}
            enableTabLoop={false}
            placeholderText="תאריך דיווח"
            icon={<Image src="/assets/icons/calendar-1.svg" width={30} height={30} alt="calendar" />}
            showIcon={true}
            calendarIconClassName="calendar-icon"
            locale={he}
            timeZone="Asia/Jerusalem"
          />
        </div>

        <div style={{ width: "100%" }}>
          <ReactSelect
            options={groups}
            value={formData.selectedGroup}
            onChange={(option) => handleChange(option, 'selectedGroup')}
            placeholder="בחר קבוצה"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={selectStyle}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>

        <div style={{ width: "100%" }}>
          <ReactSelect
            options={harvestTypes}
            value={formData.selectedHarvest}
            onChange={(option) => handleChange(option, 'selectedHarvest')}
            placeholder="בחר סוג קטיף"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={selectStyle}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={handleNext} className={styles.nextButton}>
          הבא
          <BsArrowLeft size={20} />
        </button>
      </div>
    </div>
  );
}
