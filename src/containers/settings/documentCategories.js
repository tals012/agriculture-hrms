"use client";

import { useState } from "react";
import styles from "@/styles/containers/settings/documentCategories.module.scss";

const DocumentCategories = () => {
  const [activeTab, setActiveTab] = useState("template");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  // Mock data - will be replaced with real data later
  const templateCategories = [
    { id: 1, name: "חוזים", description: "קטגוריית תבניות לחוזים" },
    { id: 2, name: "טפסים", description: "קטגוריית תבניות לטפסים" },
  ];

  const simpleCategories = [
    { id: 1, name: "חשבוניות", description: "קטגורית מסמכים לחשבוניות" },
    { id: 2, name: "אישורים", description: "קטגורית מסמכים לאישורים" },
  ];

  const currentCategories = activeTab === "template" ? templateCategories : simpleCategories;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
  };

  const handleEdit = (category) => {
    setShowAddForm(true);
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // This will be implemented later with real actions
    console.log("Form submitted:", formData);
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
  };

  const handleDelete = (id) => {
    // This will be implemented later with real actions
    console.log("Delete category with id:", id);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>קטגוריות מסמכים</h2>
      
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
            <div className={styles.formGroup}>
              <label>תיאור</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
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
          {currentCategories.map((category) => (
            <div key={category.id} className={styles.categoryItem}>
              <div className={styles.categoryInfo}>
                <h4>{category.name}</h4>
                <p>{category.description}</p>
              </div>
              <div className={styles.categoryActions}>
                <button 
                  className={styles.editButton} 
                  onClick={() => handleEdit(category)}
                >
                  עריכה
                </button>
                <button 
                  className={styles.deleteButton} 
                  onClick={() => handleDelete(category.id)}
                >
                  מחיקה
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentCategories;
