"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/containers/settings/documentCategories.module.scss";
import { toast } from "react-toastify";
import { getWorkerTemplateCategories } from "@/app/(backend)/actions/workers/documentCategory/getWorkerTemplateCategories";
import { getWorkerSimpleCategories } from "@/app/(backend)/actions/workers/documentCategory/getWorkerSimpleCategories";
import { addWorkerTemplateCategory } from "@/app/(backend)/actions/workers/documentCategory/addWorkerTemplateCategory";
import { addWorkerSimpleCategory } from "@/app/(backend)/actions/workers/documentCategory/addWorkerSimpleCategory";
import { updateWorkerTemplateCategory } from "@/app/(backend)/actions/workers/documentCategory/updateWorkerTemplateCategory";
import { updateWorkerSimpleCategory } from "@/app/(backend)/actions/workers/documentCategory/updateWorkerSimpleCategory";
import { deleteWorkerTemplateCategory } from "@/app/(backend)/actions/workers/documentCategory/deleteWorkerTemplateCategory";
import { deleteWorkerSimpleCategory } from "@/app/(backend)/actions/workers/documentCategory/deleteWorkerSimpleCategory";

const DocumentCategories = ({ initialTab = "template" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [templateCategories, setTemplateCategories] = useState([]);
  const [simpleCategories, setSimpleCategories] = useState([]);

  // When initialTab prop changes, update activeTab
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // * fetch template categories
  const fetchTemplateCategories = async () => {
    try {
      const res = await getWorkerTemplateCategories();
      if (res.ok) {
        setTemplateCategories(res.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("שגיאה בטעינת קטגוריות תבניות");
    }
  };

  // * fetch simple categories
  const fetchSimpleCategories = async () => {
    try {
      const res = await getWorkerSimpleCategories();
      if (res.ok) {
        setSimpleCategories(res.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("שגיאה בטעינת קטגוריות פשוטות");
    }
  };

  useEffect(() => {
    if (activeTab === "template") {
      fetchTemplateCategories();
    } else {
      fetchSimpleCategories();
    }
  }, [activeTab]);

  const currentCategories = activeTab === "template" ? templateCategories : simpleCategories;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: "" });
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setEditingCategory(null);
    setFormData({ name: "" });
  };

  const handleEdit = (category) => {
    setShowAddForm(true);
    setEditingCategory(category);
    setFormData({ name: category.name });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);

      if (editingCategory) {
        formDataObj.append("id", editingCategory.id);
      }

      let res;
      if (activeTab === "template") {
        res = editingCategory
          ? await updateWorkerTemplateCategory(formDataObj)
          : await addWorkerTemplateCategory(formDataObj);
      } else {
        res = editingCategory
          ? await updateWorkerSimpleCategory(formDataObj)
          : await addWorkerSimpleCategory(formDataObj);
      }

      if (!res.ok) {
        toast.error(res.error || "שגיאה בשמירת הקטגוריה");
        return;
      }

      toast.success(
        editingCategory
          ? "הקטגוריה עודכנה בהצלחה"
          : "הקטגוריה נוספה בהצלחה"
      );

      setShowAddForm(false);
      setEditingCategory(null);
      setFormData({ name: "" });

      // Refresh categories
      if (activeTab === "template") {
        fetchTemplateCategories();
      } else {
        fetchSimpleCategories();
      }

      // Dispatch custom event for other components to refresh data
      const event = new CustomEvent("workerCategoryUpdated");
      window.dispatchEvent(event);
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בשמירת הקטגוריה");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק קטגוריה זו?")) {
      return;
    }

    try {
      const formDataObj = new FormData();
      formDataObj.append("id", id);

      const res = activeTab === "template"
        ? await deleteWorkerTemplateCategory(formDataObj)
        : await deleteWorkerSimpleCategory(formDataObj);

      if (!res.ok) {
        toast.error(res.error || "שגיאה במחיקת הקטגוריה");
        return;
      }

      toast.success("הקטגוריה נמחקה בהצלחה");

      // Refresh categories
      if (activeTab === "template") {
        fetchTemplateCategories();
      } else {
        fetchSimpleCategories();
      }

      // Dispatch custom event for other components to refresh data
      const event = new CustomEvent("workerCategoryUpdated");
      window.dispatchEvent(event);
    } catch (error) {
      console.error(error);
      toast.error("שגיאה במחיקת הקטגוריה");
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: "" });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>קטגוריות מסמכים</h2>
      
      {/* Show tabs only when no initialTab is provided or when document-categories is used */}
      {(!initialTab || initialTab === "document-categories") && (
        <div className={styles.tabs}>
          <div
            className={`${styles.tab} ${activeTab === "template" ? styles.active : ""}`}
            onClick={() => handleTabChange("template")}
          >
            קטגוריות תבניות
          </div>
          <div
            className={`${styles.tab} ${activeTab === "simple" ? styles.active : ""}`}
            onClick={() => handleTabChange("simple")}
          >
            קטגוריות פשוטות
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.header}>
          <h3>{activeTab === "template" ? "קטגוריות תבניות" : "קטגוריות פשוטות"}</h3>
          <button className={styles.addButton} onClick={handleAddNew}>
            הוסף קטגוריה חדשה +
          </button>
        </div>

        {showAddForm && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <h4>{editingCategory ? "עריכת קטגוריה" : "הוספת קטגוריה חדשה"}</h4>
            <div className={styles.formGroup}>
              <label>שם הקטגוריה</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                {editingCategory ? "שמור שינויים" : "הוסף קטגוריה"}
              </button>
              <button type="button" className={styles.cancelButton} onClick={handleCancel}>
                ביטול
              </button>
            </div>
          </form>
        )}

        <div className={styles.categoriesList}>
          {currentCategories.length === 0 ? (
            <div className={styles.emptyState}>אין קטגוריות זמינות</div>
          ) : (
            currentCategories.map((category) => (
              <div key={category.id} className={styles.categoryItem}>
                <div className={styles.categoryInfo}>
                  <h4>{category.name}</h4>
                </div>
                <div className={styles.categoryActions}>
                  <button className={styles.editButton} onClick={() => handleEdit(category)}>
                    עריכה
                  </button>
                  <button className={styles.deleteButton} onClick={() => handleDelete(category.id)}>
                    מחיקה
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentCategories;
