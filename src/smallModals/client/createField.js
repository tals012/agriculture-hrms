"use client";
import { useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import TextField from "@/components/textField";
import Spinner from "@/components/spinner";
import createField from "@/app/(backend)/actions/fields/createField";
import styles from "@/styles/smallModals/client/createClient.module.scss";

export default function CreateField({ setModalOpen, setCreateStatus, clientId }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    typeOfProduct: "",
    contactPhone: "",
    contactPersonName: "",
    address: "",
    size: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const payload = {
        ...formData,
        size: formData.size ? parseFloat(formData.size) : null,
        clientId,
      };

      const res = await createField({ payload });

      if (res?.status === 201) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
        setCreateStatus(true);
        setModalOpen(false);
      } else {
        if (res?.errors) {
          res.errors.forEach(error => {
            toast.error(`${error.field}: ${error.message}`, {
              position: "top-center",
              autoClose: 3000,
            });
          });
        } else {
          toast.error(res?.message || "Failed to create field", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error creating field:", error);
      toast.error("Internal server error", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.typeOfProduct;

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
          <h2>יצירת שדה</h2>

          <div className={styles.fields}>
            <TextField
              label="שם"
              name="name"
              width="48.3%"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="סוג תוצרת"
              name="typeOfProduct"
              width="48.3%"
              value={formData.typeOfProduct}
              onChange={handleInputChange}
              required
            />
            <TextField
              label="איש קשר"
              name="contactPersonName"
              width="48.3%"
              value={formData.contactPersonName}
              onChange={handleInputChange}
            />
            <TextField
              label="טלפון"
              name="contactPhone"
              width="48.3%"
              value={formData.contactPhone}
              onChange={handleInputChange}
            />
            <TextField
              label="כתובת"
              name="address"
              width="48.3%"
              value={formData.address}
              onChange={handleInputChange}
            />
            <TextField
              label="גודל (דונם)"
              name="size"
              width="48.3%"
              value={formData.size}
              onChange={handleInputChange}
              type="number"
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