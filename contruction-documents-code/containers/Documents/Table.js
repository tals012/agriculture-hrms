"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import Spinner from "@/components/spinner";
import Modal from "@/components/clientOnly/modal";
import UploadDocModal from "./UploadDocModal";
import Button from "@/components/button";
import Select from "react-select";
import styles from "@/styles/containers/screens/singleWorker/documents.module.scss";
import { getUploadedDocuments } from "@/app/actions/fieldman/digitalForms/getUploadDocuments";
import { deleteWorkerDocument } from "@/app/actions/workers/documents/deleteDocument";
import getUserProfile from "@/app/actions/profile/getUserProfile";
import { createWorkerLog } from "@/app/actions/logs/worker/createWorkerLog";
import { getWorkerSimpleCategories } from "@/app/actions/categories/worker/getWorkerSimpleCategories";
import { updateWorkerDocument } from "@/app/actions/workers/documents/updateDocument";
import { sendBulkRemoteSignatureWithSingleLink } from "@/app/actions/fieldman/digitalForms/sendBulkRemoteSignatureWithSingleLink";
import { resendPasswordForRemoteDoc } from "@/app/actions/fieldman/digitalForms/resendPasswordForRemoteDoc";
import { resendPasswordForRemoteDocBulkSigningSession } from "@/app/actions/fieldman/digitalForms/resendPasswordForRemoteDocBulkSigningSession";

const DeleteDocument = ({
  documentId,
  documentName,
  workerId,
  refetchDocs,
}) => {
  const [loading, setLoading] = useState(false);

  const deleteDocument = async () => {
    if (confirm("האם אתה בטוח שברצונך למחוק מסמך זה?")) {
      try {
        setLoading(true);

        // Get current user
        const userResponse = await getUserProfile();
        const currentUser = userResponse.data;

        const res = await deleteWorkerDocument(documentId);

        if (res.ok) {
          // Log the delete action
          await createWorkerLog({
            workerId,
            details: {
              action: "DELETE_DOCUMENT",
              field: "document",
              oldValue: documentName,
              newValue: "נמחק",
              userName: currentUser.name,
              userRole: currentUser.role,
              date: new Date().toISOString(),
            },
          });

          toast.success("המסמך נמחק בהצלחה", {
            position: "top-center",
          });
          refetchDocs?.();
        } else {
          toast.error(res.message || "שגיאה במחיקת המסמך", {
            position: "top-center",
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  return loading ? (
    <Spinner />
  ) : (
    <Image
      onClick={deleteDocument}
      src="/assets/icons/delete-icon.svg"
      alt="delete-icon"
      width={20}
      height={20}
      className="cursor-pointer"
    />
  );
};

const DocumentsTable = ({
  workerId,
  showUploadDocModal,
  onChangeUploadModalState,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [workerPhone, setWorkerPhone] = useState("");
  const [customPhoneRow, setCustomPhoneRow] = useState(null);
  const [customPhone, setCustomPhone] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [updatingCategory, setUpdatingCategory] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [activeMenu, setActiveMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef(null);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [showBulkPhoneInput, setShowBulkPhoneInput] = useState(false);
  const [bulkCustomPhone, setBulkCustomPhone] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    const cookieValue = document?.cookie
      ?.split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    const fetchData = async () => {
      try {
        console.log("first");
        const res = await fetch(
          `/api/admin/foreign-workers/general/${workerId}`,
          {
            method: "GET",
            headers: {
              Cookie: `token=${cookieValue};`,
            },
          }
        );
        if (!res.ok) {
          console.log("error fetching data");
        }
        let data = await res.json();
        console.log(data?.generalDetails);
        setWorkerPhone(data?.generalDetails?.israelPhoneNumber);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [workerId]);

  console.log("TALSHAEEM-- ", data);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await getWorkerSimpleCategories();
        console.log("Categories response:", response);
        console.log("Categories data:", response?.data);
        if (response?.ok && Array.isArray(response.data)) {
          setCategories(response.data);
          console.log("Set categories to:", response.data);
        } else {
          console.error("Invalid categories response:", response);
          toast.error("שגיאה בטעינת הקטגוריות", {
            position: "top-center",
          });
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("שגיאה בטעינת הקטגוריות", {
          position: "top-center",
        });
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const sendDocumentLinkViaSMS = async (
    phone,
    documentSlug,
    documentBulkSigningSessionSlug,
    documentDirectLink,
    DocName,
    isRemoteDoc
  ) => {
    try {
      if (!phone) {
        toast.error("שגיאה, נא לבדוק שהטלפון תקין", {
          position: "top-center",
        });
        return;
      }
      setLoading(true);

      // Get current user
      const userResponse = await getUserProfile();
      const currentUser = userResponse.data;

      if (isRemoteDoc) {
        if (documentSlug) {
          const res = await resendPasswordForRemoteDoc({
            slug: documentSlug,
            phone: phone,
          });
          if (!res.ok) {
            toast.error("שגיאה בשליחת SMS", {
              position: "top-center",
            });
            return;
          }
        } else if (documentBulkSigningSessionSlug) {
          const res = await resendPasswordForRemoteDocBulkSigningSession({
            slug: documentBulkSigningSessionSlug,
            phone: phone,
          });
          if (!res.ok) {
            toast.error("שגיאה בשליחת SMS", {
              position: "top-center",
            });
            return;
          }
        } else {
          toast.error("שגיאה בשליחת SMS", {
            position: "top-center",
          });
          return;
        }
      } else {
        // For regular documents, send direct link
        const documentLink = documentSlug
          ? `${window.location.origin}/${documentSlug}`
          : documentDirectLink;
        const message = `מסמך חדש שלח אליך: ${DocName}, \n${documentLink}`;
        const res = await fetch("/api/admin/sms/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `token=${
              document.cookie
                .split("; ")
                .find((row) => row.startsWith("token="))
                .split("=")[1]
            };`,
          },
          body: JSON.stringify({
            phone: phone,
            message: message,
            workerId: workerId,
          }),
        });
        if (!res.ok) {
          toast.error("שגיאה בשליחת SMS", {
            position: "top-center",
          });
          return;
        }
      }
      // Log the SMS send action
      await createWorkerLog({
        workerId,
        details: {
          action: "SEND_DOCUMENT_SMS",
          field: "document",
          oldValue: DocName,
          newValue: `נשלח ל-${phone}`,
          userName: currentUser.name,
          userRole: currentUser.role,
          date: new Date().toISOString(),
        },
      });

      toast.success("המסמך נשלח לעובד בהצלחה!", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("שגיאה, נא לבדו שהטלפון תקין", {
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  const getForeignWorkerDocuments = async (_workerId) => {
    try {
      setLoadingTemplates(true);
      const res = await getUploadedDocuments({ foreignWorkerId: _workerId });
      console.log("Documents response:", res);
      console.log("Documents data:", res?.data);
      if (res.ok) {
        setData(res.data);
        console.log("Set documents to:", res.data);
      }
    } catch (e) {
      console.error("Error fetching documents:", e);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (workerId) {
      getForeignWorkerDocuments(workerId);
    }
  }, [workerId]);

  const handleCategoryChange = async (
    documentId,
    newCategoryId,
    documentName
  ) => {
    try {
      setUpdatingCategory(documentId);

      // Get current user
      const userResponse = await getUserProfile();
      const currentUser = userResponse.data;

      const oldCategory =
        data.find((doc) => doc.id === documentId)?.category || "לא מסווג";
      const newCategory =
        categories.find((cat) => cat.id === newCategoryId)?.name || "לא מסווג";

      const res = await updateWorkerDocument({
        id: documentId,
        categoryId: newCategoryId,
      });

      if (res.ok) {
        // Log the category change
        await createWorkerLog({
          workerId,
          details: {
            action: "UPDATE_DOCUMENT_CATEGORY",
            field: "category",
            oldValue: oldCategory,
            newValue: newCategory,
            documentName: documentName,
            userName: currentUser.name,
            userRole: currentUser.role,
            date: new Date().toISOString(),
          },
        });

        toast.success("הקטגוריה עודכנה בהצלחה", {
          position: "top-center",
        });
        getForeignWorkerDocuments(workerId);
      } else {
        toast.error(res?.error || "שגיאה בעדכון הקטגוריה", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("שגיאה בעדכון הקטגוריה", {
        position: "top-center",
      });
    } finally {
      setUpdatingCategory(null);
    }
  };

  // Transform categories for react-select
  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));
  categoryOptions.unshift({ value: "", label: "לא מסווג" });

  // Group documents by category
  const documentsByCategory = data.reduce((acc, doc) => {
    const categoryId = doc.simpleCategoryId || "uncategorized";
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(doc);
    return acc;
  }, {});

  // Get documents for active tab with search filtering
  const getActiveDocuments = () => {
    let filteredDocs =
      activeTab === "all" ? data : documentsByCategory[activeTab] || [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredDocs = filteredDocs.filter((doc) => {
        const dateStr = dayjs(doc.createdAt).format("DD/MM/YYYY");
        const nameMatch = doc.name?.toLowerCase().includes(query);
        const noteMatch = doc.note?.toLowerCase().includes(query);
        const dateMatch = dateStr.includes(query);
        return nameMatch || noteMatch || dateMatch;
      });
    }

    return filteredDocs;
  };

  // Add click outside listener to close the menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add bulk selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDocs(getActiveDocuments().map((doc) => doc.id));
    } else {
      setSelectedDocs([]);
    }
  };

  const handleSelectAllInCategory = (categoryId) => {
    const categoryDocs =
      categoryId === "uncategorized"
        ? documentsByCategory["uncategorized"] || []
        : documentsByCategory[categoryId] || [];

    const allCategoryDocsSelected = categoryDocs.every((doc) =>
      selectedDocs.includes(doc.id)
    );

    if (allCategoryDocsSelected) {
      // Unselect all docs in this category
      setSelectedDocs(
        selectedDocs.filter((id) => !categoryDocs.find((doc) => doc.id === id))
      );
    } else {
      // Select all docs in this category
      const newSelectedDocs = [...selectedDocs];
      categoryDocs.forEach((doc) => {
        if (!newSelectedDocs.includes(doc.id)) {
          newSelectedDocs.push(doc.id);
        }
      });
      setSelectedDocs(newSelectedDocs);
    }
  };

  const isCategoryFullySelected = (categoryId) => {
    const categoryDocs =
      categoryId === "uncategorized"
        ? documentsByCategory["uncategorized"] || []
        : documentsByCategory[categoryId] || [];

    return (
      categoryDocs.length > 0 &&
      categoryDocs.every((doc) => selectedDocs.includes(doc.id))
    );
  };

  const handleSelectDoc = (docId) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter((id) => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`האם אתה בטוח שברצונך למחוק ${selectedDocs.length} מסמכים?`)) {
      try {
        setLoading(true);
        const userResponse = await getUserProfile();
        const currentUser = userResponse.data;

        for (const docId of selectedDocs) {
          const doc = data.find((d) => d.id === docId);
          const res = await deleteWorkerDocument(docId);

          if (res.ok) {
            await createWorkerLog({
              workerId,
              details: {
                action: "DELETE_DOCUMENT",
                field: "document",
                oldValue: doc.name,
                newValue: "נמחק",
                userName: currentUser.name,
                userRole: currentUser.role,
                date: new Date().toISOString(),
              },
            });
          }
        }

        toast.success("המסמכים נמחקו בהצלחה", {
          position: "top-center",
        });
        getForeignWorkerDocuments(workerId);
        setSelectedDocs([]);
      } catch (e) {
        console.error(e);
        toast.error("שגיאה במחיקת המסמכים", {
          position: "top-center",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkSendToWorker = async () => {
    try {
      setLoading(true);

      for (const docId of selectedDocs) {
        const doc = data.find((d) => d.id === docId);
        if (doc.link) {
          await sendDocumentLinkViaSMS(
            workerPhone,
            doc.slug,
            doc.bulkSigningSessionSlug,
            doc.link,
            doc.name,
            doc.type === "REMOTE_DOCUMENT"
          );
        }
      }

      toast.success("המסמכים נשלחו בהצלחה", {
        position: "top-center",
      });
      setSelectedDocs([]);
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בשליחת המסמכים", {
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSendToCustomPhone = async () => {
    if (!bulkCustomPhone) return;

    try {
      setLoading(true);

      for (const docId of selectedDocs) {
        const doc = data.find((d) => d.id === docId);
        if (doc.link) {
          await sendDocumentLinkViaSMS(
            bulkCustomPhone,
            doc.slug,
            doc.bulkSigningSessionSlug,
            doc.link,
            doc.name,
            doc.type === "REMOTE_DOCUMENT"
          );
        }
      }

      toast.success("המסמכים נשלחו בהצלחה", {
        position: "top-center",
      });
      setSelectedDocs([]);
      setShowBulkPhoneInput(false);
      setBulkCustomPhone("");
    } catch (e) {
      console.error(e);
      toast.error("שגיאה בשליחת המסמכים", {
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingTemplates) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size={40} />
        <p className="mt-4 text-lg font-medium text-gray-600">טוען תבניות...</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 mb-6">
        <button
          className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
            activeTab === "all"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("all")}
        >
          כל המסמכים{" "}
          <span
            className={`ml-2 text-xs ${
              activeTab === "all" ? "text-blue-100" : "text-gray-500"
            }`}
          >
            ({data.length})
          </span>
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
              activeTab === category.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setActiveTab(category.id)}
          >
            {category.name}{" "}
            <span
              className={`ml-2 text-xs ${
                activeTab === category.id ? "text-blue-100" : "text-gray-500"
              }`}
            >
              ({(documentsByCategory[category.id] || []).length})
            </span>
          </button>
        ))}
        <button
          className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
            activeTab === "uncategorized"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("uncategorized")}
        >
          לא מסווג
          <span
            className={`ml-2 text-xs ${
              activeTab === "uncategorized" ? "text-blue-100" : "text-gray-500"
            }`}
          >
            ({(documentsByCategory["uncategorized"] || []).length})
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי שם, הערה או תאריך..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDocs.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-md">
          <span className="text-sm font-medium">
            נבחרו {selectedDocs.length} מסמכים
          </span>
          <div className="flex gap-2">
            <Button
              onClick={handleBulkDelete}
              variant="secondary"
              bgc="#dc2626"
              h={35}
              w={80}
            >
              מחיקה
            </Button>
            <Button
              h={35}
              w={80}
              onClick={handleBulkSendToWorker}
              variant="secondary"
            >
              שלח לעובד
            </Button>
            <Button
              h={35}
              w={120}
              onClick={() => setShowBulkPhoneInput(true)}
              variant="secondary"
            >
              שלח למספר אחר
            </Button>
          </div>
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className="w-[50px] text-center " style={{ padding: "0" }}>
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    selectedDocs.length === getActiveDocuments().length &&
                    getActiveDocuments().length > 0
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className="sr-only">בחר הכל</span>
              </div>
            </th>
            <th>תאריך יצירה</th>
            <th>שם המסמך</th>
            <th>קטגוריה</th>
            {getActiveDocuments().some(
              (doc) => doc.type === "REMOTE_DOCUMENT"
            ) && (
              <>
                <th>נשלח בתאריך</th>
                <th>נחתם בתאריך</th>
                <th>נקרא בתאריך</th>
              </>
            )}
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {getActiveDocuments().map((row, idx) => {
            const isRemoteDoc = row.type === "REMOTE_DOCUMENT";
            return (
              <tr
                key={idx.toString()}
                style={{
                  backgroundColor: isRemoteDoc ? "#FCFFFC" : "white",
                }}
              >
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(row.id)}
                    onChange={() => handleSelectDoc(row.id)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "start",
                      gap: "10px",
                    }}
                  >
                    {isRemoteDoc && (
                      <Image
                        src="/assets/icons/contract.svg"
                        alt="eye-icon"
                        width={22}
                        height={22}
                      />
                    )}
                    {dayjs(row.createdAt).format("DD/MM/YYYY | HH:mm")}

                    {row.uploadedByUser && (
                      <span style={{ fontSize: "12px", color: "#90948c" }}>
                        נוצר על ידי - {row.uploadedByUser}
                      </span>
                    )}
                  </div>
                  <p>
                    {isRemoteDoc ? (
                      <span style={{ fontSize: "12px", color: "#90948c" }}>
                        חתימה מרחוק
                      </span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#90948c" }}>
                        חתימה דנית
                      </span>
                    )}
                  </p>
                </td>
                <td>
                  <p>{row.name || "-"}</p>
                  {row.note && (
                    <p style={{ fontSize: "12px", color: "#90948c" }}>
                      {row.note}
                    </p>
                  )}
                  {isRemoteDoc && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        row.isRemoteDocSubmitted
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                      style={{ display: "inline-block", marginTop: "4px" }}
                    >
                      {row.isRemoteDocSubmitted
                        ? "נחתם על ידי העובד"
                        : "ממתין לחתימת העובד"}
                    </span>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Select
                      value={
                        categoryOptions.find(
                          (option) => option.value === row.simpleCategoryId
                        ) || categoryOptions[0]
                      }
                      onChange={(option) => {
                        handleCategoryChange(
                          row.id,
                          option?.value || "",
                          row.name
                        );
                      }}
                      options={categoryOptions}
                      isDisabled={
                        loadingCategories || updatingCategory === row.id
                      }
                      isLoading={
                        loadingCategories || updatingCategory === row.id
                      }
                      placeholder="בחר קטגוריה"
                      isClearable
                      styles={{
                        container: (provided) => ({
                          ...provided,
                          minWidth: "180px",
                        }),
                        control: (provided, state) => ({
                          ...provided,
                          borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
                          boxShadow: state.isFocused
                            ? "0 0 0 1px #3b82f6"
                            : "none",
                          "&:hover": {
                            borderColor: "#3b82f6",
                          },
                        }),
                      }}
                    />
                  </div>
                </td>
                {getActiveDocuments().some(
                  (doc) => doc.type === "REMOTE_DOCUMENT"
                ) && (
                  <>
                    <td>
                      <div className="flex flex-col">
                        <span
                          className={`text-sm ${
                            row.remoteDocSmsStatus === "COMPLETED"
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {row.remoteDocSmsStatusAt
                            ? dayjs(row.remoteDocSmsStatusAt).format(
                                "DD/MM/YYYY | HH:mm"
                              )
                            : "-"}
                        </span>
                        {row.remoteDocSmsStatus === "COMPLETED" && (
                          <span className="text-xs text-green-600">נשלח</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span
                          className={`text-sm ${
                            row.isRemoteDocSubmitted
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {row.remoteDocSubmittedAt
                            ? dayjs(row.remoteDocSubmittedAt).format(
                                "DD/MM/YYYY | HH:mm"
                              )
                            : "-"}
                        </span>
                        {row.isRemoteDocSubmitted && (
                          <span className="text-xs text-green-600">נחתם</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span
                          className={`text-sm ${
                            row.isRemoteDocRead
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {row.remoteDocReadAt
                            ? dayjs(row.remoteDocReadAt).format(
                                "DD/MM/YYYY | HH:mm"
                              )
                            : "-"}
                        </span>
                        {row.isRemoteDocRead && (
                          <span className="text-xs text-green-600">נקרא</span>
                        )}
                      </div>
                    </td>
                  </>
                )}
                <td>
                  <div className="flex items-center gap-2">
                    {row.link &&
                      (!isRemoteDoc ||
                        (isRemoteDoc && row.isRemoteDocSubmitted)) && (
                        <a
                          href={row.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-80 transition-opacity"
                        >
                          <Image
                            src="/assets/icons/eye-icon.svg"
                            alt="eye-icon"
                            width={20}
                            height={20}
                            className="cursor-pointer"
                          />
                        </a>
                      )}
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === idx ? null : idx);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="text-gray-600"
                        >
                          <circle cx="5" cy="12" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="19" cy="12" r="2" />
                        </svg>
                      </button>
                      {activeMenu === idx && (
                        <div
                          className="fixed py-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200"
                          style={{
                            zIndex: 99999,
                            position: "absolute",
                            left: "-20px",
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Menu container clicked");
                          }}
                        >
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-sm text-right hover:bg-gray-100 flex items-center gap-2"
                            onMouseDown={async (e) => {
                              console.log("Send to worker clicked");
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                await sendDocumentLinkViaSMS(
                                  workerPhone,
                                  row.slug,
                                  row.bulkSigningSessionSlug,
                                  row.link,
                                  row.name,
                                  row.type === "REMOTE_DOCUMENT"
                                );
                                setActiveMenu(null);
                              } catch (error) {
                                console.error("Error sending SMS:", error);
                              }
                            }}
                          >
                            {loading ? (
                              <Spinner size={16} color={"#4F46E5"} />
                            ) : (
                              <>
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-gray-600"
                                >
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                שלח לעובד
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-sm text-right hover:bg-gray-100 flex items-center gap-2"
                            onMouseDown={(e) => {
                              console.log("Send to another number clicked");
                              e.preventDefault();
                              e.stopPropagation();
                              setCustomPhoneRow(idx);
                              setActiveMenu(null);
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-gray-600"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            שלח למספר אחר
                          </button>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-sm text-right hover:bg-gray-100 flex items-center gap-2 text-red-600"
                            onMouseDown={async (e) => {
                              console.log("Delete clicked");
                              e.preventDefault();
                              e.stopPropagation();
                              if (
                                confirm("האם אתה בטוח שברצונך למחוק מסמך זה?")
                              ) {
                                try {
                                  setLoading(true);
                                  const userResponse = await getUserProfile();
                                  const currentUser = userResponse.data;

                                  const res = await deleteWorkerDocument(
                                    row.id
                                  );

                                  if (res.ok) {
                                    await createWorkerLog({
                                      workerId,
                                      details: {
                                        action: "DELETE_DOCUMENT",
                                        field: "document",
                                        oldValue: row.name,
                                        newValue: "נמחק",
                                        userName: currentUser.name,
                                        userRole: currentUser.role,
                                        date: new Date().toISOString(),
                                      },
                                    });

                                    toast.success("המסמך נמחק בהצלחה", {
                                      position: "top-center",
                                    });
                                    getForeignWorkerDocuments(workerId);
                                  } else {
                                    toast.error(
                                      res.message || "שגיאה במחיקת המסמך",
                                      {
                                        position: "top-center",
                                      }
                                    );
                                  }
                                } catch (e) {
                                  console.error(e);
                                  toast.error("שגיאה במחיקת המסמך", {
                                    position: "top-center",
                                  });
                                } finally {
                                  setLoading(false);
                                  setActiveMenu(null);
                                }
                              }
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-red-600"
                            >
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            מחיקה
                          </button>
                        </div>
                      )}
                    </div>
                    {customPhoneRow === idx && (
                      <div
                        className="fixed py-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200"
                        style={{ zIndex: 99999 }}
                      >
                        <div className="p-3 flex flex-col justify-between items-center">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">
                              הזן מספר טלפון
                            </span>
                            <button
                              onClick={() => {
                                setCustomPhoneRow(null);
                                setCustomPhone("");
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <input
                            type="tel"
                            placeholder="הזן מספר טלפון"
                            value={customPhone}
                            onChange={(e) => setCustomPhone(e.target.value)}
                            className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            style={{ direction: "ltr" }}
                          />
                          <Button
                            onClick={async () => {
                              await sendDocumentLinkViaSMS(
                                customPhone,
                                row.slug,
                                row.bulkSigningSessionSlug,
                                row.link,
                                row.name,
                                row.type === "REMOTE_DOCUMENT"
                              );
                              setCustomPhoneRow(null);
                              setCustomPhone("");
                            }}
                            disabled={!customPhone || loading}
                            w={100}
                          >
                            {loading ? (
                              <Spinner size={16} color={"white"} />
                            ) : (
                              "שלח"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Modal
        isOpen={showUploadDocModal}
        onClose={() => {
          onChangeUploadModalState(false);
        }}
      >
        <UploadDocModal
          workerId={workerId}
          onRefresh={() => {
            onChangeUploadModalState(false);
            getForeignWorkerDocuments(workerId);
          }}
        />
      </Modal>
      {/* Bulk Send to Custom Phone Modal */}
      <Modal
        isOpen={showBulkPhoneInput}
        title="שליחת מסמכים למספר טלפון"
        onClose={() => {
          setShowBulkPhoneInput(false);
          setBulkCustomPhone("");
        }}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">הזן מספר טלפון</label>
            <input
              type="tel"
              value={bulkCustomPhone}
              onChange={(e) => setBulkCustomPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ direction: "ltr" }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setShowBulkPhoneInput(false);
                setBulkCustomPhone("");
              }}
              variant="secondary"
            >
              ביטול
            </Button>
            <Button
              onClick={handleBulkSendToCustomPhone}
              disabled={!bulkCustomPhone || loading}
            >
              {loading ? <Spinner size={16} color="white" /> : "שלח"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsTable;
