"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Select from "react-select";

import Spinner from "@/components/spinner";
import FormEditor from "./formEditor";
import TemplatesDropdown from "./templatesDropdown";

import { createSignedUploadURLs } from "@/app/(backend)/actions/assets/createSignedUploadURLs";
import { sendForRemoteSignature } from "@/app/(backend)/actions/workers/digitalForm/sendForRemoteSignature";
import { getWorkerSimpleCategories } from "@/app/(backend)/actions/workers/documentCategory/getWorkerSimpleCategories";

import styles from "@/styles/containers/signedForm/form.module.scss";
import Modal from "@/components/modal";
import { Button, Input } from "@mui/material";
import TextField from "@/components/textField";

const initialFieldValues = {
  name: "",
  category: "",
  note: "",
};

const Form = ({ foreignWorkerId, source }) => {
  const [selectedTemplate, setSelectedTemplate] = useState({
    id: null,
    link: "",
  });
  const [showSendForSignatureModal, setShowSendForSignatureModal] =
    useState(false);
  const [fields, setFields] = useState(initialFieldValues);
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // FETCH SIMPLE CATEGORIES
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await getWorkerSimpleCategories();
        if (response?.ok && Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          console.error("Invalid categories response:", response);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));
  categoryOptions.unshift({ value: "", label: "לא מסווג" });

  const loadRemoteFile = useCallback(async (_link) => {
    try {
      setIsLoading(true);
      const res = await fetch(_link);

      if (res.ok) {
        const json = await res.json();
        setFile(json);
      } else {
        toast.error("Failed to load the file.", {
          position: "top-center",
        });
      }
    } catch (e) {
      toast.error("Failed to load the file.", {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onSendForSignature = useCallback(
    async (formData) => {
      const name = formData.get("name");
      const note = formData.get("note");
      try {
        setIsLoading(true);
        console.log("Sending with simpleCategoryId:", fields.category);
        const res = await sendForRemoteSignature({
          templateId: selectedTemplate.id,
          foreignWorkerId,
          name,
          simpleCategoryId: fields.category || "",
          note: note || "",
        });
        // redirect to worker documents page
        if (res.ok) {
          toast.success("המסמך נשלח בהצלחה לטלפון העובד", {
            position: "top-center",
          });
          setShowSendForSignatureModal(false);
          router.replace(
            `/${
              source === "ADMIN" ? "admin" : "fieldman"
            }/workers/?worker=${foreignWorkerId}&type=documents`
          );
        } else {
          console.error("Error response:", res);
          toast.error(
            "לא ניתן לשלוח לעובד את המסמך. נא לוודא שקיים טלפון לעובד",
            {
              position: "top-center",
            }
          );
        }
      } catch (e) {
        console.error("Error sending for signature:", e);
        toast.error("Failed to send the file for signature.", {
          position: "top-center",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTemplate.id, foreignWorkerId, fields.category, router]
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        backgroundColor: "#F6F6F6",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          marginTop: "20px",
          width: "100%",
          maxWidth: "1520px",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          הפקת וחתימת מסמכים
        </div>
        <div
          style={{
            marginTop: "10px",
            fontSize: "16px",
          }}
        >
          יש לבחור במסמך הרצוי
        </div>

        <br />
        <hr />
        <br />
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <TemplatesDropdown
            selectedTemplate={selectedTemplate}
            onChange={(id, t) => {
              if (t !== selectedTemplate?.link) {
                setSelectedTemplate({ id: id, link: t });
                loadRemoteFile(t);
              }
            }}
          />
          {!!selectedTemplate?.id && (
            <button
              pl={10}
              pr={10}
              type="button"
              onClick={() => {
                setShowSendForSignatureModal(true);
              }}
              className={styles.button}
            >
              שליחה לחתימה מרחוק
            </button>
          )}
        </div>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: "1520px",
          marginTop: "20px",
        }}
      >
        {!!file && (
          <FormEditor
            key={file.id}
            file={file}
            foreignWorkerId={foreignWorkerId}
            source={source}
          />
        )}
      </div>
      {isLoading && <Spinner size={20} />}
      <Modal
        isOpen={showSendForSignatureModal}
        title={"שליחה לחתימה מרחוק"}
        onClose={() => {
          if (!isLoading) setShowSendForSignatureModal(false);
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendForSignature(new FormData(e.target));
          }}
        >
          <TextField
            label={"שם המסמך"}
            style={{ marginBottom: 20 }}
            value={fields.name}
            onChange={(e) => setFields((p) => ({ ...p, name: e.target.value }))}
            name={"name"}
            required
            contentEditable={!isLoading}
            disabled={isLoading}
          />
          <div style={{ marginBottom: 20 }}>
            <Select
              value={
                categoryOptions.find(
                  (option) => option.value === fields.category
                ) || categoryOptions[0]
              }
              onChange={(option) => {
                setFields((prev) => ({
                  ...prev,
                  category: option?.value || "",
                }));
              }}
              options={categoryOptions}
              isDisabled={isLoading || loadingCategories}
              isLoading={loadingCategories}
              placeholder="בחר קטגוריה"
              name="category"
              styles={{
                container: (provided) => ({
                  ...provided,
                  width: "100%",
                }),
                control: (provided, state) => ({
                  ...provided,
                  borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
                  boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
                  "&:hover": {
                    borderColor: "#3b82f6",
                  },
                }),
              }}
              required
            />
          </div>
          <TextField
            label={"הערות למסמך"}
            style={{ marginBottom: 20 }}
            value={fields.note}
            onChange={(e) => setFields((p) => ({ ...p, note: e.target.value }))}
            name={"note"}
            contentEditable={!isLoading}
            disabled={isLoading}
          />
          <button
            type="submit"
            w={161}
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? (
              <Spinner size={20} color={"white"} />
            ) : (
              "שמירת מסמך וסיום"
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default React.memo(Form);
