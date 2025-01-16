"use client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ReactSelect from "react-select";
import TextField from "@/components/textField";
import DateField from "@/components/dateField";
import getCities from "@/app/(backend)/actions/misc/getCities";
import updateClient from "@/app/(backend)/actions/clients/updateClient";
import Spinner from "@/components/spinner";
import styles from "@/styles/containers/bigModals/client/general/personal.module.scss";

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

const Personal = ({ personalData, setPersonalData }) => {
  const handleChange = (e, key) => {
    if (key === "openingDate" || key === "licenseFromDate" || key === "licenseToDate") {
      return setPersonalData({ ...personalData, [key]: e });
    }
    setPersonalData({ ...personalData, [key]: e.target.value });
  };

  const [cities, setCities] = useState(null);
  const [loading, setLoading] = useState(false);

  // * fetch cities
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getCities();
        const { data, status } = res;
        if (status === 200) {
          setCities(data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  // * update client
  const handleUpdate = async () => {
    try {
      setLoading(true);
      const res = await updateClient({
        payload: {
          ...personalData,
          id: personalData.id
        },
      });

      const { message, status } = res;

      if (status === 200) {
        toast.success(message, {
          position: "top-center",
          autoClose: 3000,
        });
      }

      if (status === 400) {
        toast.error(message, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.block}>
        <div className={styles.right}>
          <h3>פרטי לקוח</h3>
        </div>
        <div className={styles.left}>
          <div className={styles.fields}>
            <TextField
              label="שם"
              width="48.3%"
              value={personalData.name}
              onChange={(e) => handleChange(e, "name")}
            />
            <TextField
              label="שם באנגלית"
              width="48.3%"
              value={personalData.nameEnglish}
              onChange={(e) => handleChange(e, "nameEnglish")}
            />
            <TextField
              label="אימייל"
              width="48.3%"
              value={personalData.email}
              onChange={(e) => handleChange(e, "email")}
            />
            <TextField
              label="טלפון"
              width="48.3%"
              value={personalData.phone}
              onChange={(e) => handleChange(e, "phone")}
            />
            <TextField
              label="טלפון משני"
              width="48.3%"
              value={personalData.secondaryPhone}
              onChange={(e) => handleChange(e, "secondaryPhone")}
            />
            <DateField
              label="תאריך פתיחה"
              width="48.3%"
              value={personalData.openingDate}
              onChange={(e) => handleChange(e, "openingDate")}
            />
            <TextField
              label="כתובת"
              width="48.3%"
              value={personalData.address}
              onChange={(e) => handleChange(e, "address")}
            />
            <TextField
              label="מיקוד"
              width="48.3%"
              value={personalData.postalCode}
              onChange={(e) => handleChange(e, "postalCode")}
            />
            <TextField
              label="מספר רישיון"
              width="48.3%"
              value={personalData.licenseNumber}
              onChange={(e) => handleChange(e, "licenseNumber")}
            />
            <div style={{ width: "48.3%" }}>
              <ReactSelect
                options={[
                  { value: true, label: "כן" },
                  { value: false, label: "לא" }
                ]}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="רישיון קיים"
                value={
                  personalData.licenseExist !== null
                    ? {
                        value: personalData.licenseExist,
                        label: personalData.licenseExist ? "כן" : "לא",
                      }
                    : null
                }
                onChange={(option) =>
                  setPersonalData({
                    ...personalData,
                    licenseExist: option ? option.value : null,
                  })
                }
                menuPortalTarget={document.body}
                menuPosition={"fixed"}
                styles={selectStyle}
              />
            </div>
            <DateField
              label="רישיון מתאריך"
              width="48.3%"
              value={personalData.licenseFromDate}
              onChange={(e) => handleChange(e, "licenseFromDate")}
            />
            <DateField
              label="רישיון עד תאריך"
              width="48.3%"
              value={personalData.licenseToDate}
              onChange={(e) => handleChange(e, "licenseToDate")}
            />
            <TextField
              label="מספר עוסק מורשה"
              width="48.3%"
              value={personalData.businessGovId}
              onChange={(e) => handleChange(e, "businessGovId")}
            />
            <TextField
              label="פקס"
              width="48.3%"
              value={personalData.fax}
              onChange={(e) => handleChange(e, "fax")}
            />
            <TextField
              label="טלפון רואה חשבון"
              width="48.3%"
              value={personalData.accountantPhone}
              onChange={(e) => handleChange(e, "accountantPhone")}
            />
            <div style={{ width: "48.3%" }}>
              <ReactSelect
                options={[
                  { value: "ACTIVE", label: "פעיל" },
                  { value: "INACTIVE", label: "לא פעיל" }
                ]}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="סטטוס"
                value={
                  personalData.status
                    ? {
                        value: personalData.status,
                        label: personalData.status === "ACTIVE" ? "פעיל" : "לא פעיל",
                      }
                    : null
                }
                onChange={(option) =>
                  setPersonalData({
                    ...personalData,
                    status: option ? option.value : null,
                  })
                }
                menuPortalTarget={document.body}
                menuPosition={"fixed"}
                styles={selectStyle}
              />
            </div>
            {cities && (
              <div style={{ width: "48.3%" }}>
                <ReactSelect
                  options={cities.map((city) => ({
                    value: city.id,
                    label: city.nameInHebrew,
                  }))}
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  placeholder="עיר"
                  value={
                    personalData.cityId
                      ? {
                          value: personalData.cityId,
                          label: cities.find((c) => c.id === personalData.cityId)?.nameInHebrew,
                        }
                      : null
                  }
                  onChange={(option) =>
                    setPersonalData({
                      ...personalData,
                      cityId: option ? option.value : null,
                    })
                  }
                  menuPortalTarget={document.body}
                  menuPosition={"fixed"}
                  styles={selectStyle}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.btns}>
        <button>ביטול</button>
        <button onClick={handleUpdate}>
          {loading ? <Spinner color="#ffffff" /> : "לשמור שינויים"}
        </button>
      </div>
    </div>
  );
};

export default Personal;
