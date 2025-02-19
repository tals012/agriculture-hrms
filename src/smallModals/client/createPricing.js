"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import ReactSelect from "react-select";
import TextField from "@/components/textField";
import Spinner from "@/components/spinner";
import createPricing from "@/app/(backend)/actions/clients/createPricing";
import { getSpecies } from "@/app/(backend)/actions/misc/species/getSpecies";
import { getHarvestTypes } from "@/app/(backend)/actions/misc/harvestTypes/getHarvestTypes";
import styles from "@/styles/smallModals/client/createClient.module.scss";

export default function CreatePricing({
  setModalOpen,
  setCreateStatus,
  clientId,
}) {
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
    }),
    menu: (baseStyles) => ({
      ...baseStyles,
      zIndex: 9999,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base) => ({
      ...base,
      direction: "rtl",
    }),
  };

  const [loading, setLoading] = useState(false);
  const [species, setSpecies] = useState([]);
  const [harvestTypes, setHarvestTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    containerNorm: "",
    speciesId: "",
    harvestTypeId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [speciesRes, harvestTypesRes] = await Promise.all([
          getSpecies({}),
          getHarvestTypes({})
        ]);

        if (speciesRes?.status === 200) {
          setSpecies(speciesRes.data || []);
        }
        if (harvestTypesRes?.status === 200) {
          setHarvestTypes(harvestTypesRes.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch species or harvest types", {
          position: "top-center",
        });
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        containerNorm: parseFloat(formData.containerNorm),
        clientId,
      };

      const res = await createPricing(payload);

      if (res?.status === 201) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
        setCreateStatus(true);
        setModalOpen(false);
      } else {
        if (res?.errors) {
          res.errors.forEach((error) => {
            toast.error(`${error.field}: ${error.message}`, {
              position: "top-center",
              autoClose: 3000,
            });
          });
        } else {
          toast.error(res?.message || "יצירת התמחור נכשלה", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error creating pricing combination:", error);
      toast.error("שגיאת שרת פנימית", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.name &&
    formData.price &&
    formData.containerNorm &&
    formData.speciesId &&
    formData.harvestTypeId;

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
          <h2>יצירת תמחור</h2>

          <div className={styles.fields}>
            <TextField
              label="שם"
              name="name"
              width="48.3%"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <div style={{ width: "48.3%", zIndex: 3 }}>
              <ReactSelect
                options={species?.map((s) => ({
                  value: s.id,
                  label: s.name,
                })) || []}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="בחירת סוג"
                value={
                  formData.speciesId && species?.length
                    ? {
                        value: formData.speciesId,
                        label: species.find((s) => s.id === formData.speciesId)?.name,
                      }
                    : null
                }
                onChange={(option) =>
                  setFormData((prev) => ({
                    ...prev,
                    speciesId: option ? option.value : "",
                  }))
                }
                styles={selectStyle}
                menuPortalTarget={document.body}
                isSearchable={false}
              />
            </div>
            <div style={{ width: "48.3%", zIndex: 2 }}>
              <ReactSelect
                options={harvestTypes?.map((ht) => ({
                  value: ht.id,
                  label: ht.name,
                })) || []}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="בחר סוג קציר"
                value={
                  formData.harvestTypeId && harvestTypes?.length
                    ? {
                        value: formData.harvestTypeId,
                        label: harvestTypes.find((ht) => ht.id === formData.harvestTypeId)?.name,
                      }
                    : null
                }
                onChange={(option) =>
                  setFormData((prev) => ({
                    ...prev,
                    harvestTypeId: option ? option.value : "",
                  }))
                }
                styles={selectStyle}
                menuPortalTarget={document.body}
                isSearchable={false}
              />
            </div>
            <TextField
              label="מחיר"
              name="price"
              width="48.3%"
              value={formData.price}
              onChange={handleInputChange}
              type="number"
              required
            />
            <TextField
              label="נורמת מיכל"
              name="containerNorm"
              width="48.3%"
              value={formData.containerNorm}
              onChange={handleInputChange}
              type="number"
              required
            />
            <button
              onClick={handleCreate}
              disabled={loading || !isFormValid}
              style={{ width: "48.3%" }}
            >
              {loading ? <Spinner color="#ffffff" /> : "יצירה"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
