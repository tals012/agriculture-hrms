"use client";
import { useEffect, useState } from "react";
import TextField from "@/components/textField";
import ReactSelect from "react-select";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import Image from "next/image";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { BsArrowLeft } from "react-icons/bs";
import styles from "@/styles/containers/attendance/general.module.scss";
import getGroups from "@/app/(backend)/actions/groups/getGroups";
import getPricing from "@/app/(backend)/actions/groups/getPricing";

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

export default function General({
  data,
  onUpdate,
  onStepChange,
  managerId,
  leaderId,
}) {
  const [formData, setFormData] = useState({
    fullName: data?.fullName || "",
    reportDate: data?.reportDate || new Date(),
    selectedGroup: data?.selectedGroup || null,
    selectedPricing: data?.selectedPricing || null,
  });

  // ! ============================
  // ! GROUPS
  // ! ============================
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      if (!managerId && !leaderId) return;

      const response = await getGroups({ managerId, leaderId });
      if (response.status === 200) {
        console.log(response.data, "response.data");
        if (response.data.length === 0) {
          setGroups([]);
        } else {
          setGroups(response.data);
        }

        setGroupsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [managerId, leaderId]);

  // ! ============================
  // ! GROUPS END
  // ! ============================

  // ! ============================
  // ! PRICING
  // ! ============================
  const [pricing, setPricing] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(true);

  const fetchPricing = async () => {
    try {
      if (!formData.selectedGroup) return;

      const response = await getPricing({
        groupId: formData.selectedGroup.value,
      });
      if (response.status === 200) {
        console.log(response.data, "response.data");
        if (response.data.length === 0) {
          setPricing([]);
        } else {
          setPricing(response.data);
        }
        setPricingLoading(false);
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
      setPricing([]);
      setPricingLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [formData.selectedGroup]);

  // ! ============================
  // ! PRICING END
  // ! ============================

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
        rtl: true,
      });
      return;
    }

    if (!formData.selectedGroup) {
      toast.error("נא לבחור קבוצה", {
        position: "top-center",
        autoClose: 3000,
        rtl: true,
      });
      return;
    }

    if (!formData.selectedPricing) {
      toast.error("נא לבחור סוג קטיף", {
        position: "top-center",
        autoClose: 3000,
        rtl: true,
      });
      return;
    }

    onStepChange("workers-attendance");
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
            onChange={(e) => handleChange(e.target.value, "fullName")}
          />
        </div>

        <div style={{ width: "100%" }}>
          {formData.reportDate && (
            <label className={styles.label}>תאריך דיווח</label>
          )}
          <DatePicker
            selected={formData.reportDate}
            onChange={(date) => handleChange(date, "reportDate")}
            className={styles.datepicker}
            wrapperClassName={styles.dateWrapper}
            enableTabLoop={false}
            placeholderText="תאריך דיווח"
            dateFormat="dd/MM/yyyy"
            icon={
              <Image
                src="/assets/icons/calendar-1.svg"
                width={30}
                height={30}
                alt="calendar"
              />
            }
            showIcon={true}
            calendarIconClassName="calendar-icon"
            locale={he}
            timeZone="Asia/Jerusalem"
          />
        </div>

        <div style={{ width: "100%" }}>
          <ReactSelect
            options={groups.map((group) => ({
              value: group.id,
              label: group.name,
            }))}
            value={formData.selectedGroup}
            onChange={(option) => handleChange(option, "selectedGroup")}
            placeholder="בחר קבוצה"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={selectStyle}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isLoading={groupsLoading}
          />
        </div>

        {formData.selectedGroup && (
          <div style={{ width: "100%" }}>
            <ReactSelect
              options={pricing.map((pricing) => ({
                value: pricing.id,
                label: pricing.harvestType.name + " " + pricing.species.name,
              }))}
              value={formData.selectedPricing}
              onChange={(option) => handleChange(option, "selectedPricing")}
              placeholder="בחר סוג קטיף"
              components={{
                IndicatorSeparator: () => null,
              }}
              styles={selectStyle}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              isLoading={pricingLoading}
            />
          </div>
        )}
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
