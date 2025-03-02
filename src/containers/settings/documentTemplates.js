"use client";

import { useState } from "react";
import styles from "@/styles/containers/settings/documentTemplates.module.scss";

const DocumentTemplates = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock data - will be replaced with real data later
  const templateCategories = [
    { id: 1, name: "חוזים" },
    { id: 2, name: "טפסים" },
  ];

  const templates = [
    { 
      id: 1, 
      name: "חוזה העסקה", 
      category: "חוזים", 
      categoryId: 1, 
      description: "תבנית לחוזה העסקה סטנדרטי", 
      createdAt: "01/06/2023",
      lastUpdated: "15/08/2023" 
    },
    { 
      id: 2, 
      name: "הסכם שירות", 
      category: "חוזים", 
      categoryId: 1, 
      description: "תבנית להסכם שירות עם לקוחות", 
      createdAt: "12/04/2023",
      lastUpdated: "12/04/2023" 
    },
    { 
      id: 3, 
      name: "טופס בקשה", 
      category: "טפסים", 
      categoryId: 2, 
      description: "תבנית לטופס בקשה כללי", 
      createdAt: "22/02/2023",
      lastUpdated: "05/07/2023" 
    },
    { 
      id: 4, 
      name: "טופס הצטרפות", 
      category: "טפסים", 
      categoryId: 2, 
      description: "תבנית לטופס הצטרפות לשירות", 
      createdAt: "10/03/2023",
      lastUpdated: "10/03/2023" 
    },
  ];

  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter(template => template.categoryId === parseInt(selectedCategory));

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleAddTemplate = () => {
    // Will be implemented later
    console.log("Add template button clicked");
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>תבניות מסמכים</h2>
      
      <div className={styles.controls}>
        <div className={styles.filterContainer}>
          <label htmlFor="category-filter">סינון לפי קטגוריה:</label>
          <select 
            id="category-filter" 
            value={selectedCategory} 
            onChange={handleCategoryChange}
            className={styles.filter}
          >
            <option value="all">הכל</option>
            {templateCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          className={styles.addButton}
          onClick={handleAddTemplate}
        >
          הוסף תבנית חדשה +
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>שם התבנית</th>
              <th>קטגוריה</th>
              <th>תיאור</th>
              <th>תאריך יצירה</th>
              <th>עודכן לאחרונה</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(template => (
                <tr key={template.id}>
                  <td>{template.name}</td>
                  <td>{template.category}</td>
                  <td>{template.description}</td>
                  <td>{template.createdAt}</td>
                  <td>{template.lastUpdated}</td>
                  <td className={styles.actions}>
                    <button className={styles.editButton}>עריכה</button>
                    <button className={styles.deleteButton}>מחיקה</button>
                    <button className={styles.viewButton}>צפייה</button>
                    <button className={styles.downloadButton}>הורדה</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles.noData}>
                  אין תבניות מסמכים בקטגוריה זו
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentTemplates; 