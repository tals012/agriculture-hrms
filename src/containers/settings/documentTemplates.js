"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWorkerTemplates } from "@/app/(backend)/actions/workers/documentTemplate/getWorkerTemplates";
import { moveTemplate } from "@/app/(backend)/actions/workers/documentTemplate/moveTemplate";
import { deleteWorkerTemplate } from "@/app/(backend)/actions/workers/documentTemplate/deleteWorkerTemplate";
import { getWorkerTemplateCategories } from "@/app/(backend)/actions/workers/documentCategory/getWorkerTemplateCategories";
import styles from "@/styles/containers/settings/documentTemplates.module.scss";
import Modal from "@/components/modal";

const DocumentTemplates = () => {
  const [templatesByCategory, setTemplatesByCategory] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [movingTemplate, setMovingTemplate] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch both templates and categories
        const [templatesResponse, categoriesResponse] = await Promise.all([
          getWorkerTemplates(),
          getWorkerTemplateCategories(),
        ]);

        // Handle categories
        if (categoriesResponse?.ok && Array.isArray(categoriesResponse.data)) {
          setAllCategories(categoriesResponse.data);
        } else {
          console.error("Invalid categories response:", categoriesResponse);
        }

        // Handle templates
        if (!templatesResponse.ok) {
          throw new Error(templatesResponse.error || "Failed to fetch templates");
        }

        if (!templatesResponse.data || !Array.isArray(templatesResponse.data)) {
          throw new Error("Invalid data format received");
        }

        // Group templates by category
        const groupedTemplates = templatesResponse.data.reduce(
          (acc, template) => {
            if (!template) return acc;

            const categoryId = template.templateCategoryId || "uncategorized";
            const categoryName = template.templateCategoryName || "לא מסווג";

            const existingCategory = acc.find((g) => g.category.id === categoryId);
            if (existingCategory) {
              existingCategory.templates.push(template);
            } else {
              acc.push({
                category: { id: categoryId, name: categoryName },
                templates: [template],
              });
            }
            return acc;
          },
          []
        );

        setTemplatesByCategory(groupedTemplates);
      } catch (error) {
        console.error("Error in fetchData:", error);
        toast.error("שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  useEffect(() => {
    // Add event listener for category updates if necessary
    const handleCategoryUpdate = () => {
      refreshData();
    };

    window.addEventListener("workerCategoryUpdated", handleCategoryUpdate);

    return () => {
      window.removeEventListener("workerCategoryUpdated", handleCategoryUpdate);
    };
  }, []);

  const handleMoveTemplate = async (templateId, newCategoryId) => {
    try {
      setMovingTemplate(templateId);
      const result = await moveTemplate(templateId, newCategoryId);

      if (result.ok) {
        toast.success("התבנית הועברה בהצלחה");
        refreshData();
      } else {
        toast.error(result.error || "שגיאה בהעברת התבנית");
      }
    } catch (error) {
      console.error("Error moving template:", error);
      toast.error("שגיאה בהעברת התבנית");
    } finally {
      setMovingTemplate(null);
    }
  };

  const handleViewTemplate = (template) => {
    setViewingTemplate(template.id);
    router.push(`/admin/settings/view-template?link=${encodeURIComponent(template.link)}`);
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      setDeletingTemplate(templateId);
      
      const formData = new FormData();
      formData.append("templateId", templateId);
      
      const res = await deleteWorkerTemplate(formData);
      
      if (!res.ok) {
        toast.error(res.error || "שגיאה במחיקת המסמך");
        return;
      }

      toast.success("המסמך נמחק בהצלחה");
      refreshData();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("שגיאה במחיקת המסמך");
    } finally {
      setDeletingTemplate(null);
      setTemplateToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template.id);
    router.push(
      `/admin/settings/edit-template?templateId=${template.id}&link=${encodeURIComponent(template.link)}&name=${encodeURIComponent(template.name)}`
    );
  };

  if (loading) {
    return <div className={styles.loading}>טוען...</div>;
  }

  const filteredCategories =
    selectedCategory === "all"
      ? templatesByCategory
      : templatesByCategory.filter(({ category }) => category.id === selectedCategory);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>תבניות מסמכים</h2>
      
      <div className={styles.actions}>
        <div className={styles.filter}>
          <span>סנן לפי קטגוריה:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.select}
          >
            <option value="all">הכל</option>
            {allCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <Link href="/admin/settings/add-template" className={styles.addButton}>
          העלאת מסמך חדש
        </Link>
      </div>

      {filteredCategories.length === 0 ? (
        <div className={styles.emptyState}>אין תבניות זמינות</div>
      ) : (
        <div className={styles.templatesList}>
          {filteredCategories.map(({ category, templates }) => (
            <div key={category.id || "uncategorized"} className={styles.categoryGroup}>
              <div className={styles.categoryHeader}>
                <h3>{category.name}</h3>
              </div>
              
              {templates.length === 0 ? (
                <div className={styles.emptyCategory}>אין תבניות בקטגוריה זו</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>שם התבנית</th>
                      <th>תאריך יצירה</th>
                      <th>העבר לקטגוריה</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.id}>
                        <td>{template.name}</td>
                        <td>
                          {new Date(template.createdAt).toLocaleDateString("he-IL")}
                        </td>
                        <td>
                          <select
                            onChange={(e) => handleMoveTemplate(template.id, e.target.value)}
                            value={template.templateCategoryId || ""}
                            disabled={movingTemplate === template.id}
                            className={styles.categorySelect}
                          >
                            <option value="">לא מסווג</option>
                            {allCategories.map((cat) => (
                              <option
                                key={cat.id}
                                value={cat.id}
                                disabled={cat.id === template.templateCategoryId}
                              >
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          {movingTemplate === template.id && (
                            <span className={styles.movingIndicator}>מעביר...</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              onClick={() => handleViewTemplate(template)}
                              disabled={viewingTemplate === template.id}
                              className={styles.viewButton}
                            >
                              {viewingTemplate === template.id ? "טוען..." : "צפייה"}
                            </button>
                            
                            <button
                              onClick={() => handleEditTemplate(template)}
                              disabled={editingTemplate === template.id}
                              className={styles.editButton}
                            >
                              {editingTemplate === template.id ? "טוען..." : "עריכה"}
                            </button>
                            
                            <button
                              onClick={() => {
                                setTemplateToDelete(template);
                                setShowDeleteConfirm(true);
                              }}
                              disabled={deletingTemplate === template.id}
                              className={styles.deleteButton}
                            >
                              {deletingTemplate === template.id ? "מוחק..." : "מחיקה"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTemplateToDelete(null);
        }}
        title="מחיקת מסמך"
      >
        <div className={styles.deleteConfirm}>
          <p>האם אתה בטוח שברצונך למחוק את המסמך "{templateToDelete?.name}"?</p>
          <div className={styles.modalActions}>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setTemplateToDelete(null);
              }}
              className={styles.cancelButton}
            >
              ביטול
            </button>
            <button
              onClick={() => handleDeleteTemplate(templateToDelete?.id)}
              className={styles.confirmDeleteButton}
            >
              מחיקה
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentTemplates; 