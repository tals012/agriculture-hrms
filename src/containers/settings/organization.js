"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import getWorkers from "@/app/(backend)/actions/workers/getWorkers";
import TextField from "@/components/textField";
import Spinner from "@/components/spinner";
import {
  updateOrganization,
  getOrganization,
} from "@/app/(backend)/actions/organization";
import styles from "@/styles/containers/settings/organization.module.scss";

const OrganizationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    internalOrganizationId: "",
  });

  const handleSyncWorkers = async () => {
    try {
      setIsSyncing(true);

      // Get all active workers using the existing server action
      const workersData = await getWorkers({ status: "ACTIVE" });

      if (!workersData.data || workersData.status !== 200) {
        throw new Error(workersData.message || "Failed to fetch workers");
      }

      // Track success and failures
      const results = {
        total: workersData.data.length,
        success: 0,
        failed: 0,
        failedWorkers: [],
      };

      // Register each worker
      for (const worker of workersData.data) {
        try {
          const response = await fetch("/api/salary/register-worker", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ workerId: worker.id }),
          });

          if (response.ok) {
            results.success++;
          } else {
            results.failed++;
            results.failedWorkers.push(worker.nameHe || worker.name);
          }
        } catch (error) {
          results.failed++;
          results.failedWorkers.push(worker.nameHe || worker.name);
        }
      }

      // Show results in Hebrew
      if (results.failed === 0) {
        toast.success(`${results.success} עובדים סונכרנו בהצלחה עם מערכת השכר`);
      } else {
        toast.warning(
          `סונכרנו ${results.success} עובדים, אך נכשל סנכרון ${results.failed} עובדים. ` +
            `עובדים שנכשלו: ${results.failedWorkers.join(", ")}`
        );
      }
    } catch (error) {
      console.error("Error syncing workers:", error);
      toast.error("שגיאה בסנכרון העובדים עם מערכת השכר");
    } finally {
      setIsSyncing(false);
    }
  };

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>סנכרון מערכת שכר</h2>
        <p className={styles.sectionDescription}>
          סנכרן את כל העובדים הפעילים עם מערכת השכר החיצונית
        </p>
        <button
          className={styles.syncButton}
          onClick={handleSyncWorkers}
          disabled={isSyncing}
        >
          {isSyncing ? "מסנכרן..." : "סנכרן עובדים עם מערכת שכר"}
        </button>
      </div>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>הגדרות ארגון</h2>
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
    </div>
  );
};

export default OrganizationSettings;
