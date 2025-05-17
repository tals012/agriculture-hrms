"use client";

import TextField from "@/components/textField";
import ReactSelect from "react-select";
import styles from "@/styles/containers/bigModals/worker/general/tabs/tabs.module.scss";

const selectStyle = {
  control: (baseStyles) => ({
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

const AddressTab = ({ personalData, setPersonalData, countries, cities }) => {
  const handleChange = (e, key) => {
    setPersonalData({ ...personalData, [key]: e.target.value });
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.formFields}>
        <div className={styles.formField}>
          <TextField
            label="כתובת"
            width="100%"
            value={personalData.address || ""}
            onChange={(e) => handleChange(e, "address")}
          />
        </div>
        <div className={styles.formField}>
          {countries && (
            <ReactSelect
              options={countries.map((country) => ({
                value: country.id,
                label: country.nameInHebrew,
              }))}
              components={{
                IndicatorSeparator: () => null,
              }}
              placeholder="מדינה"
              value={
                personalData.countryId
                  ? {
                      value: personalData.countryId,
                      label: countries.find(
                        (c) => c.id === personalData.countryId
                      )?.nameInHebrew,
                    }
                  : null
              }
              onChange={(option) =>
                setPersonalData({
                  ...personalData,
                  countryId: option ? option.value : null,
                })
              }
              menuPortalTarget={document.body}
              menuPosition={"fixed"}
              styles={selectStyle}
            />
          )}
        </div>
        <div className={styles.formField}>
          {cities && (
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
                      label: cities.find((c) => c.id === personalData.cityId)
                        ?.nameInHebrew,
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
          )}
        </div>
        <div className={styles.formField}>
          <TextField
            label="רחוב"
            width="100%"
            value={personalData.street || ""}
            onChange={(e) => handleChange(e, "street")}
          />
        </div>
        <div className={styles.formField}>
          <TextField
            label="מספר בית"
            width="100%"
            value={personalData.houseNumber || ""}
            onChange={(e) => handleChange(e, "houseNumber")}
          />
        </div>
        <div className={styles.formField}>
          <TextField
            label="מספר דירה"
            width="100%"
            value={personalData.apartment || ""}
            onChange={(e) => handleChange(e, "apartment")}
          />
        </div>
        <div className={styles.formField}>
          <TextField
            label="מיקוד"
            width="100%"
            value={personalData.postalCode || ""}
            onChange={(e) => handleChange(e, "postalCode")}
          />
        </div>
      </div>
    </div>
  );
};

export default AddressTab;
