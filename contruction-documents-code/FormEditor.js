"use client";

import { createSignedUploadURLs } from "@/app/actions/assets/createSignedUrls";
import { uploadDocument } from "@/app/actions/fieldman/digitalForms/uploadDocument";
import PDFTemplateForm from "@/components/PDF/pdfTemplateForm";
import Button from "@/components/button";
import Modal from "@/components/clientOnly/modal";
import Input from "@/components/input";
import Spinner from "@/components/spinner";
import { generate } from "@pdfme/generator";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { getDetails } from "@/app/actions/workers/getDetails";
import { fetchTheOrganizationSettings } from "@/app/actions/organization/getOrgSetting";
import { getFontsData } from "@/components/PDF/helper";
import { getWorkerSimpleCategories } from "@/app/actions/categories/worker/getWorkerSimpleCategories";
import Select from "react-select";

const initialFieldValues = {
  name: "",
  category: "",
  note: "",
};

function FormEditor({
  file,
  foreignWorkerId,
  source,
  onSave,
  nextDocId,
  countryCode,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState(initialFieldValues);
  const confirmedFileBlobToUpload = useRef(null);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [workerDetails, setWorkerDetails] = useState(null);
  const router = useRouter();
  const [organizationSettings, setOrganizationSettings] = useState(null);
  const [categories, setCategories] = React.useState([]);
  const [loadingCategories, setLoadingCategories] = React.useState(true);

  const _onSave = async (formData) => {
    try {
      setIsLoading(true);
      console.log("Form data:", {
        name: formData.get("name"),
        category: fields.category,
        note: formData.get("note"),
      });

      const singedUploadUrlRes = await createSignedUploadURLs({
        files: [{ ext: ".pdf", type: "PDF" }],
      });

      if (!singedUploadUrlRes.ok) {
        throw new Error("Failed to create signed upload URLs");
      }

      const singedUploadUrl =
        singedUploadUrlRes.data[0].assetStorageFileUploadURL;
      const templateAssetId = singedUploadUrlRes.data[0].assetId;

      const uploadRes = await fetch(singedUploadUrl, {
        method: "PUT",
        body: confirmedFileBlobToUpload.current,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload the document");
      }

      const addDoc = await uploadDocument({
        foreignWorkerId,
        documentAssetId: templateAssetId,
        documentType: "SIGNED",
        name: formData.get("name"),
        simpleCategoryId: fields.category,
        note: formData.get("note") || "",
      });

      if (!addDoc?.ok) {
        throw new Error(addDoc.message);
      }

      toast.success("המסמך עלה בהצלחה!", { position: "top-center" });
      router.replace(
        `/${
          source === "ADMIN" ? "admin" : "fieldman"
        }/workers/?worker=${foreignWorkerId}&type=documents`
      );
    } catch (e) {
      console.error("Error saving document:", e);
      toast.error("Error saving document: " + e.message, {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (foreignWorkerId) {
      const fetchDetails = async () => {
        const response = await getDetails(foreignWorkerId);
        if (response.status === 200) {
          setWorkerDetails(response.data);
          console.log("getDetails - - - - - ", response.data);
        } else {
          toast.error(response.message, { position: "top-center" });
        }
      };
      fetchDetails();
    }
  }, [foreignWorkerId]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await fetchTheOrganizationSettings();
        if (settings) {
          setOrganizationSettings(settings);
        }
      } catch (error) {
        console.error("Failed to fetch organization settings:", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await getWorkerSimpleCategories();
        if (response?.ok && Array.isArray(response.data)) {
          setCategories(response.data);
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

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));
  categoryOptions.unshift({ value: "", label: "בחר קטגוריה" });

  return (
    <div style={{ width: "100%", position: "relative", minHeight: "100px" }}>
      {!!file && !!workerDetails && !!organizationSettings ? (
        <PDFTemplateForm
          template={file}
          organizationSettings={organizationSettings}
          workerDetails={workerDetails}
          source={source}
          nextDocId={nextDocId}
          workerId={foreignWorkerId}
          onSubmit={async (data) => {
            try {
              console.log("FormEditor onSubmit - data:", data);
              console.log("FormEditor onSubmit - template:", data.template);
              console.log("FormEditor onSubmit - inputs:", data.inputs);
              console.log("FormEditor onSubmit - first input:", data.inputs[0]);

              // Add serial number and presireal to inputs
              if (data.inputs && data.inputs.length > 0) {
                data.inputs[0].worker_serial_number =
                  workerDetails?.serialNumber?.toString() || "";
                data.inputs[0].worker_prev_serial_number =
                  workerDetails?.prevSerialNumber?.toString() || "";
              }

              const font = await getFontsData();
              const filledPdf = await generate({
                ...data,
                options: { font },
              });

              const blob = new Blob([filledPdf.buffer], {
                type: "application/pdf",
              });
              confirmedFileBlobToUpload.current = blob;
              if (onSave) {
                onSave(blob);
              } else {
                setShowConfirmSave(true);
              }
            } catch (error) {
              console.error("Error generating PDF:", error);
              console.error("Data at time of error:", {
                workerDetails,
                organizationSettings,
                template: data?.template,
                inputs: data?.inputs,
                inputsFirstItem: data?.inputs?.[0],
              });
              toast.error("Failed to generate PDF: " + error.message, {
                position: "top-center",
              });
            }
          }}
          countryCode={countryCode}
        />
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spinner size={20} />
          {!workerDetails && <div>טוען פרטי עובד...</div>}
          {!organizationSettings && <div>טוען הגדרות ארגון...</div>}
        </div>
      )}

      <Modal
        isOpen={showConfirmSave}
        title={"פרטי המסמך"}
        onClose={() => {
          if (!isLoading) setShowConfirmSave(false);
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            _onSave(new FormData(e.target));
          }}
        >
          <Input
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              קטגוריה
            </label>
            <Select
              value={
                categoryOptions.find(
                  (option) => option.value === fields.category
                ) || categoryOptions[0]
              }
              onChange={(option) => {
                console.log("Selected category:", option);
                setFields((prev) => ({
                  ...prev,
                  category: option?.value || "",
                }));
              }}
              options={categoryOptions}
              isDisabled={isLoading || loadingCategories}
              isLoading={loadingCategories}
              placeholder="בחר קטגוריה"
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
          <Input
            label={"הערות למסמך"}
            style={{ marginBottom: 20 }}
            value={fields.note}
            onChange={(e) => setFields((p) => ({ ...p, note: e.target.value }))}
            name={"note"}
            contentEditable={!isLoading}
            disabled={isLoading}
          />
          <Button type="submit" w={161} disabled={isLoading}>
            {isLoading ? (
              <Spinner size={20} color={"white"} />
            ) : (
              "שמירת מסמך וסיום"
            )}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export default FormEditor;
