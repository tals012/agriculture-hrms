"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import ReactSelect from "react-select";
import TextField from "@/components/textField";
import Spinner from "@/components/spinner";
import createClient from "@/app/(backend)/actions/clients/createClient";
import getCities from "@/app/(backend)/actions/misc/getCities";
import styles from "@/styles/smallModals/client/createClient.module.scss";

export default function CreateClient({ setModalOpen, setCreateStatus }) {
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
      zIndex: 999999999999,
    }),
  };

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [cityId, setCityId] = useState("");
  const [cities, setCities] = useState(null);

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

  // * create client
  const handleCreate = async () => {
    try {
      setLoading(true);
      let payload = {
        name,
        email,
        phone,
        cityId: cityId,
      };
      if (secondaryPhone) {
        payload.secondaryPhone = secondaryPhone;
      }
      const res = await createClient({ payload });
      const { message, status } = res;
      if (status === 201) {
        toast.success(message, {
          position: "top-center",
          autoClose: 3000,
        });
        setCreateStatus(true);
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
      toast.error("Internal server error", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <Image
            src="/assets/icons/cross-2.svg"
            alt="cross-icon"
            width={20}
            height={20}
            className={styles.closeIcon}
            onClick={() => setModalOpen(false)}
          />
        </div>

        <div className={styles.content}>
          <h2>יצירת לקוח </h2>

          <div className={styles.fields}>
            <TextField
              label="שם"
              width="48.3%"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="אימייל"
              width="48.3%"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="טלפון"
              width="48.3%"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <TextField
              label="טלפון משני "
              width="48.3%"
              value={secondaryPhone}
              onChange={(e) => setSecondaryPhone(e.target.value)}
            />
            {cities && (
              <div
                style={{
                  width: "48.3%",
                }}
              >
                <ReactSelect
                  options={
                    cities
                      ? cities.map((city) => ({
                          value: city.id,
                          label: city.nameInHebrew,
                        }))
                      : []
                  }
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  placeholder="עיר"
                  name="cityId"
                  value={
                    cityId
                      ? {
                          value: cityId,
                          label: cities.find((i) => i.id === cityId)
                            .nameInHebrew,
                        }
                      : null
                  }
                  onChange={(option) => setCityId(option ? option.value : null)}
                  styles={selectStyle}
                />
              </div>
            )}
            <button
              onClick={handleCreate}
              disabled={loading || !name || !email || !phone || !cityId}
            >
              {loading ? <Spinner color="#ffffff" /> : "יצירה"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
