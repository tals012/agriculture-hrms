"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/containers/settings/organization.module.scss";
import TextField from "@/components/textField";
import Spinner from "@/components/spinner";
import { toast } from "react-hot-toast";
import { updateOrganization, getOrganization } from "@/app/(backend)/actions/organization";

export default function OrganizationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    internalOrganizationId: ""
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const response = await getOrganization();
      if (response.data) {
        setFormData(response.data);
      }
    } catch (error) {
      toast.error("שגיאה בטעינת נתוני הארגון");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await updateOrganization(formData);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success("הארגון עודכן בהצלחה");
      }
    } catch (error) {
      toast.error("שגיאה בעדכון הארגון");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}><Spinner /></div>;
  }

  return (
    <div className={styles.container}>
      <h2>הגדרות ארגון</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fields}>
          <TextField
            label="שם הארגון"
            name="name"
            value={formData.name}
            onChange={handleChange}
            width="48.3%"
            required
          />
          <TextField
            label="אימייל"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            width="48.3%"
            required
          />
          <TextField
            label="טלפון"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            width="48.3%"
          />
          <TextField
            label="כתובת"
            name="address"
            value={formData.address}
            onChange={handleChange}
            width="48.3%"
          />
          <TextField
            label="עיר"
            name="city"
            value={formData.city}
            onChange={handleChange}
            width="48.3%"
          />
          <TextField
            label="מיקוד"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            width="48.3%"
          />
          <TextField
            label="מזהה ארגון פנימי"
            name="internalOrganizationId"
            value={formData.internalOrganizationId}
            onChange={handleChange}
            width="48.3%"
          />
        </div>
        <div className={styles.actions}>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={saving}
          >
            {saving ? <Spinner size={14} color="#fff" /> : "שמור שינויים"}
          </button>
        </div>
      </form>
    </div>
  );
} 