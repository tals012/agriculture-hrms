"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ReactSelect from "react-select";
import TextField from "@/components/textField";
import DateField from "@/components/dateField";
import getCities from "@/app/(backend)/actions/misc/getCities";
import getCountries from "@/app/(backend)/actions/misc/getCountries";
import getClients from "@/app/(backend)/actions/clients/getClients";
import updateWorker from "@/app/(backend)/actions/workers/updateWorker";
import Spinner from "@/components/spinner";
import styles from "@/styles/containers/bigModals/worker/general/personal.module.scss";
import { getBranches } from "@/app/(backend)/actions/branch/getBranches";
import { getBanks } from "@/app/(backend)/actions/bank/getBanks";
import { format, parseISO } from "date-fns";

// Helper function to format date in dd/mm/yyyy
const formatDate = (date) => {
  if (!date) return null;
  try {
    // If the date is a string (ISO format), parse it first
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy');
  } catch (error) {
    console.error("Date formatting error:", error);
    return date;
  }
};

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
  // Format dates in personalData for display when component mounts
  useEffect(() => {
    if (personalData) {
      // Only update the display formatting, not the actual data that will be sent
      const formattedDates = {
        ...personalData,
      };
      setPersonalData(formattedDates);
    }
  }, []);

  const handleChange = (e, key) => {
    if (
      key === "birthday" ||
      key === "passportValidity" ||
      key === "visaValidity" ||
      key === "inscriptionDate" ||
      key === "entryDate"
    ) {
      return setPersonalData({ ...personalData, [key]: e });
    }
    setPersonalData({ ...personalData, [key]: e.target.value });
  };

  const [cities, setCities] = useState(null);
  const [countries, setCountries] = useState(null);
  const [clients, setClients] = useState(null);
  const [banks, setBanks] = useState(null);
  const [branches, setBranches] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesRes, countriesRes, clientsRes, banksRes, branchesRes] =
          await Promise.all([
            getCities(),
            getCountries(),
            getClients(),
            getBanks(),
            getBranches(),
          ]);

        if (citiesRes.status === 200) {
          setCities(citiesRes.data);
        }
        if (countriesRes.status === 200) {
          setCountries(countriesRes.data);
        }
        if (clientsRes.status === 200) {
          setClients(clientsRes.data);
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

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const res = await updateWorker({
        payload: {
          ...personalData,
          workerId: personalData.id,
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
          <h3>פרטים אישיים</h3>
        </div>
        <div className={styles.left}>
          <div className={styles.fields}>
            <TextField
              label="שם בעברית"
              width="48.3%"
              value={personalData.nameHe}
              onChange={(e) => handleChange(e, "nameHe")}
            />
            <TextField
              label="שם משפחה בעברית"
              width="48.3%"
              value={personalData.surnameHe}
              onChange={(e) => handleChange(e, "surnameHe")}
            />
            <div style={{ width: "48.3%" }}>
              <ReactSelect
                options={[
                  { value: "MALE", label: "זכר" },
                  { value: "FEMALE", label: "נקבה" },
                ]}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="מין"
                value={
                  personalData.sex
                    ? {
                        value: personalData.sex,
                        label: personalData.sex === "MALE" ? "זכר" : "נקבה",
                      }
                    : null
                }
                onChange={(option) =>
                  setPersonalData({
                    ...personalData,
                    sex: option ? option.value : null,
                  })
                }
                menuPortalTarget={document.body}
                menuPosition={"fixed"}
                styles={selectStyle}
              />
            </div>
            <DateField
              label="תאריך לידה"
              width="48.3%"
              value={personalData.birthday}
              onChange={(e) => handleChange(e, "birthday")}
            />
            <TextField
              label="טלפון ראשי"
              width="48.3%"
              value={personalData.primaryPhone}
              onChange={(e) => handleChange(e, "primaryPhone")}
            />
            <TextField
              label="טלפון משני"
              width="48.3%"
              value={personalData.secondaryPhone}
              onChange={(e) => handleChange(e, "secondaryPhone")}
            />
            <TextField
              label="אימייל"
              width="48.3%"
              value={personalData.email}
              onChange={(e) => handleChange(e, "email")}
            />
            <TextField
              label="כתובת"
              width="48.3%"
              value={personalData.address}
              onChange={(e) => handleChange(e, "address")}
            />
            {countries && (
              <div style={{ width: "48.3%" }}>
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
              </div>
            )}
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
                          label: cities.find(
                            (c) => c.id === personalData.cityId
                          )?.nameInHebrew,
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
            {banks && (
              <div style={{ width: "48.3%" }}>
                <ReactSelect
                  options={banks.map((bank) => ({
                    value: bank.id,
                    label: bank.hebrewName,
                  }))}
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  placeholder="בנק"
                  value={
                    personalData.bankId
                      ? {
                          value: personalData.bankId,
                          label: banks.find((b) => b.id === personalData.bankId)
                            ?.hebrewName,
                        }
                      : null
                  }
                  onChange={(option) =>
                    setPersonalData({
                      ...personalData,
                      bankId: option ? option.value : null,
                    })
                  }
                  menuPortalTarget={document.body}
                  menuPosition={"fixed"}
                  styles={selectStyle}
                  isClearable={true}
                  isSearchable={true}
                  isMulti={false}
                  isLoading={loading}
                  isDisabled={loading}
                />
              </div>
            )}
            {branches && (
              <div style={{ width: "48.3%" }}>
                <ReactSelect
                  options={branches.map((branch) => ({
                    value: branch.id,
                    label: branch.hebrewName,
                  }))}
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  placeholder="סניף"
                  value={
                    personalData.branchId
                      ? {
                          value: personalData.branchId,
                          label: branches.find(
                            (b) => b.id === personalData.branchId
                          )?.hebrewName,
                        }
                      : null
                  }
                  onChange={(option) =>
                    setPersonalData({
                      ...personalData,
                      branchId: option ? option.value : null,
                    })
                  }
                  menuPortalTarget={document.body}
                  menuPosition={"fixed"}
                  styles={selectStyle}
                  isClearable={true}
                  isSearchable={true}
                  isMulti={false}
                  isLoading={loading}
                  isDisabled={loading}
                />
              </div>
            )}

            <TextField
              label="מספר חשבון בנק"
              width="48.3%"
              value={personalData.bankAccountNumber}
              onChange={(e) => handleChange(e, "bankAccountNumber")}
            />

            <TextField
              label="רחוב"
              width="48.3%"
              value={personalData.street}
              onChange={(e) => handleChange(e, "street")}
            />

            <TextField
              label="מספר בית"
              width="48.3%"
              value={personalData.houseNumber}
              onChange={(e) => handleChange(e, "houseNumber")}
            />

            <TextField
              label="מספר דירה"
              width="48.3%"
              value={personalData.apartment}
              onChange={(e) => handleChange(e, "apartment")}
            />

            <TextField
              label="מיקוד"
              width="48.3%"
              value={personalData.postalCode}
              onChange={(e) => handleChange(e, "postalCode")}
            />
          </div>
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.right}>
          <h3>מסמכים</h3>
        </div>
        <div className={styles.left}>
          <div className={styles.fields}>
            <TextField
              label="דרכון"
              width="48.3%"
              value={personalData.passport}
              onChange={(e) => handleChange(e, "passport")}
            />
            <DateField
              label="תוקף דרכון"
              width="48.3%"
              value={personalData.passportValidity}
              onChange={(e) => handleChange(e, "passportValidity")}
            />
            <TextField
              label="ויזה"
              width="48.3%"
              value={personalData.visa}
              onChange={(e) => handleChange(e, "visa")}
            />
            <DateField
              label="תוקף ויזה"
              width="48.3%"
              value={personalData.visaValidity}
              onChange={(e) => handleChange(e, "visaValidity")}
            />
            <DateField
              label="תאריך רישום"
              width="48.3%"
              value={personalData.inscriptionDate}
              onChange={(e) => handleChange(e, "inscriptionDate")}
            />
            <DateField
              label="תאריך כניסה"
              width="48.3%"
              value={personalData.entryDate}
              onChange={(e) => handleChange(e, "entryDate")}
            />
          </div>
        </div>
      </div>

      {/* <div className={styles.block}>
        <div className={styles.right}>
          <h3>פרטים נוספים</h3>
        </div>
        <div className={styles.left}>
          <div className={styles.fields}>
            <div style={{ width: "48.3%" }}>
              <ReactSelect
                options={[
                  { value: "ACTIVE", label: "פעיל" },
                  { value: "INACTIVE", label: "לא פעיל" },
                  { value: "FREEZE", label: "מוקפא" },
                  { value: "COMMITTEE", label: "ועדה" },
                  { value: "HIDDEN", label: "מוסתר" },
                  { value: "IN_TRANSIT", label: "במעבר" },
                ]}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="סטטוס"
                value={
                  personalData.workerStatus
                    ? {
                        value: personalData.workerStatus,
                        label: {
                          ACTIVE: "פעיל",
                          INACTIVE: "לא פעיל",
                          FREEZE: "מוקפא",
                          COMMITTEE: "ועדה",
                          HIDDEN: "מוסתר",
                          IN_TRANSIT: "במעבר",
                        }[personalData.workerStatus],
                      }
                    : null
                }
                onChange={(option) =>
                  setPersonalData({
                    ...personalData,
                    workerStatus: option ? option.value : null,
                  })
                }
                menuPortalTarget={document.body}
                menuPosition={"fixed"}
                styles={selectStyle}
              />
            </div>
            {clients && (
              <div style={{ width: "48.3%" }}>
                <ReactSelect
                  options={clients.map((client) => ({
                    value: client.id,
                    label: client.name,
                  }))}
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  placeholder="לקוח"
                  value={
                    personalData.clientId
                      ? {
                          value: personalData.clientId,
                          label: clients.find((c) => c.id === personalData.clientId)?.name,
                        }
                      : null
                  }
                  onChange={(option) =>
                    setPersonalData({
                      ...personalData,
                      clientId: option ? option.value : null,
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
      </div> */}

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
