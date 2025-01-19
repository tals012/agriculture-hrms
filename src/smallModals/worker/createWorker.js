"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ReactSelect from "react-select";
import TextField from "@/components/textField";
import DateField from "@/components/dateField";
import getCities from "@/app/(backend)/actions/misc/getCities";
import getCountries from "@/app/(backend)/actions/misc/getCountries";
import getClients from "@/app/(backend)/actions/clients/getClients";
import createWorker from "@/app/(backend)/actions/workers/createWorker";
import Spinner from "@/components/spinner";
import styles from "@/styles/smallModals/worker/createWorker.module.scss";

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

const CreateWorker = ({ setModalOpen, setCreateStatus }) => {
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState(null);
  const [countries, setCountries] = useState(null);
  const [clients, setClients] = useState(null);
  const [data, setData] = useState({
    nameHe: "",
    surnameHe: "",
    sex: null,
    birthday: null,
    primaryPhone: "",
    passport: "",
    countryId: "",
    cityId: "",
    clientId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesRes, countriesRes, clientsRes] = await Promise.all([
          getCities(),
          getCountries(),
          getClients(),
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
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e, key) => {
    if (key === "birthday") {
      return setData({ ...data, [key]: e });
    }
    setData({ ...data, [key]: e.target.value });
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const res = await createWorker({
        payload: data,
      });

      const { message, status } = res;

      if (status === 201) {
        toast.success(message, {
          position: "top-center",
          autoClose: 3000,
        });
        setCreateStatus(Date.now());
        setModalOpen(false);
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
    <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>הוספת עובד</h2>
        </div>

        <div className={styles.content}>
          <div className={styles.block}>
            <h3>פרטים אישיים</h3>
            <div className={styles.fields}>
              <TextField
                label="שם בעברית"
                width="48.3%"
                value={data.nameHe}
                onChange={(e) => handleChange(e, "nameHe")}
              />
              <TextField
                label="שם משפחה בעברית"
                width="48.3%"
                value={data.surnameHe}
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
                    data.sex
                      ? {
                          value: data.sex,
                          label: data.sex === "MALE" ? "זכר" : "נקבה",
                        }
                      : null
                  }
                  onChange={(option) =>
                    setData({
                      ...data,
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
                value={data.birthday}
                onChange={(e) => handleChange(e, "birthday")}
              />
            </div>
          </div>

          <div className={styles.block}>
            <h3>פרטי קשר</h3>
            <div className={styles.fields}>
              <TextField
                label="טלפון ראשי"
                width="48.3%"
                value={data.primaryPhone}
                onChange={(e) => handleChange(e, "primaryPhone")}
              />
              <TextField
                label="דרכון"
                width="48.3%"
                value={data.passport}
                onChange={(e) => handleChange(e, "passport")}
              />
              <div style={{ width: "48.3%" }}>
                <ReactSelect
                  options={
                    countries?.map((country) => ({
                      value: country.id,
                      label: country.nameInHebrew,
                    })) || []
                  }
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  placeholder="מדינה"
                  value={
                    data.countryId && countries
                      ? {
                          value: data.countryId,
                          label:
                            countries.find((c) => c.id === data.countryId)
                              ?.nameInHebrew || "",
                        }
                      : null
                  }
                  onChange={(option) =>
                    setData({
                      ...data,
                      countryId: option ? option.value : "",
                    })
                  }
                  menuPortalTarget={document.body}
                  menuPosition={"fixed"}
                  styles={selectStyle}
                />
              </div>
              <div style={{ width: "48.3%" }}>
                <ReactSelect
                  options={
                    cities?.map((city) => ({
                      value: city.id,
                      label: city.nameInHebrew,
                    })) || []
                  }
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  placeholder="עיר"
                  value={
                    data.cityId && cities
                      ? {
                          value: data.cityId,
                          label:
                            cities.find((c) => c.id === data.cityId)
                              ?.nameInHebrew || "",
                        }
                      : null
                  }
                  onChange={(option) =>
                    setData({
                      ...data,
                      cityId: option ? option.value : "",
                    })
                  }
                  menuPortalTarget={document.body}
                  menuPosition={"fixed"}
                  styles={selectStyle}
                />
              </div>
              <div style={{ width: "48.3%" }}>
                <ReactSelect
                  options={
                    clients?.map((client) => ({
                      value: client.id,
                      label: client.name,
                    })) || []
                  }
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  placeholder="לקוח"
                  value={
                    data.clientId && clients
                      ? {
                          value: data.clientId,
                          label:
                            clients.find((c) => c.id === data.clientId)?.name || "",
                        }
                      : null
                  }
                  onChange={(option) =>
                    setData({
                      ...data,
                      clientId: option ? option.value : "",
                    })
                  }
                  menuPortalTarget={document.body}
                  menuPosition={"fixed"}
                  styles={selectStyle}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={() => setModalOpen(false)}
            disabled={loading}
          >
            ביטול
          </button>
          <button
            className={styles.createBtn}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? <Spinner size={16} /> : "יצירה"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorker; 