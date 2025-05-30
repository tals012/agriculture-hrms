"use client";
import { useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import TextField from "@/components/textField";
import Spinner from "@/components/spinner";
import createManager from "@/app/(backend)/actions/managers/createManager";
import styles from "@/styles/smallModals/client/createClient.module.scss";

export default function CreateManager({
  setModalOpen,
  setCreateStatus,
  clientId,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

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
      // Debug: Log client ID and form data
      console.log("Creating manager with clientId:", clientId);
      console.log("Form data:", formData);

      // Make sure clientId is a string and valid
      if (!clientId) {
        console.error("Invalid clientId:", clientId);
        toast.error("מזהה לקוח חסר או לא תקין", {
          position: "top-center",
          autoClose: 3000,
        });
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        clientId: String(clientId), // Ensure clientId is a string
      };

      console.log("Sending payload to createManager:", payload);
      const res = await createManager(payload);
      console.log("Response from createManager:", res);

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
          toast.error(res?.message || "יצירת המנהל נכשלה", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error creating manager:", error);
      toast.error("שגיאת שרת פנימית", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.phone;

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
          <h2>יצירת מנהל</h2>

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
              label="אימייל"
              name="email"
              width="48.3%"
              value={formData.email}
              onChange={handleInputChange}
              type="email"
              required
            />
            <TextField
              label="טלפון"
              name="phone"
              width="48.3%"
              value={formData.phone}
              onChange={handleInputChange}
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
