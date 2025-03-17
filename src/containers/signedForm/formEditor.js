"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Select from "react-select";

import Spinner from "@/components/spinner";

import PDFTemplateForm from "@/components/pdf/pdfTemplateForm";
import { generate as pdfmeGenerate } from "@pdfme/generator";
import { getFontsData, getPlugins } from "@/components/pdf/helper";
import Modal from "@/components/modal";
import TextField from "@/components/textField";

import { uploadDocument } from "@/app/(backend)/actions/workers/digitalForm/uploadDocument";
import { getWorkerDetails } from "@/app/(backend)/actions/workers/getWorkerDetails";
import { getOrganization } from "@/app/(backend)/actions/organization/index";
import { getWorkerSimpleCategories } from "@/app/(backend)/actions/workers/documentCategory/getWorkerSimpleCategories";
import { createSignedUploadURLs } from "@/app/(backend)/actions/assets/createSignedUploadURLs";

import styles from "@/styles/containers/signedForm/form.module.scss";
import * as Helper from "@/components/pdf/helper";

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

  // -----------------------------------------------------------------------
  // FETCH WORKER DETAILS, ORGANIZATION SETTINGS, AND SIMPLE CATEGORIES
  useEffect(() => {
    if (foreignWorkerId) {
      console.log("foreignWorkerId - - - - - ", foreignWorkerId);
      const fetchDetails = async () => {
        const response = await getWorkerDetails({
          workerId: foreignWorkerId,
        });
        if (response.ok) {
          console.log("getDetails - - - - - ", response.data);
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
        const settings = await getOrganization();
        if (settings.ok) {
          console.log("getOrganization - - - - - ", settings.data);
          setOrganizationSettings(settings.data);
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
  // -----------------------------------------------------------------------

  console.log({
    file,
    workerDetails,
    organizationSettings,
  });

  // This is the key function that generates the PDF with proper plugins
  const generate = async (data) => {
    try {
      console.log("Generating PDF with data:", {
        templateSchemas: data.template.schemas,
        inputs: data.inputs,
      });
      
      // Get the fonts
      const fonts = await getFontsData();
      
      // Get plugins including our custom signature plugin
      const plugins = Helper.getPlugins();
      console.log("Using plugins for PDF generation:", Object.keys(plugins));
      
      // Process signature fields in the template
      if (data.template?.schemas) {
        data.template.schemas.forEach(schema => {
          if (!schema) return;
          
          Object.entries(schema).forEach(([key, field]) => {
            // Check if this is a signature field
            const isSignatureField = 
              field.type === 'signature' || 
              key.toLowerCase().includes('signature') || 
              key.toLowerCase() === 'sign' ||
              key.toLowerCase().includes('_sign');
            
            if (isSignatureField) {
              // Convert signature field to image field
              schema[key] = {
                type: "image",
                position: field.position,
                width: field.width || 170,
                height: field.height || 40,
                rotate: field.rotate || 0,
                opacity: field.opacity || 1
              };
            }
          });
        });
      }
      
      // Generate the PDF
      const pdf = await pdfmeGenerate({
        template: data.template,
        inputs: data.inputs,
        options: {
          font: fonts,
          imageType: 'png',
          imageQuality: 1,
          compress: false
        },
        plugins: plugins
      });
      
      // Create a blob from the PDF buffer
      return new Blob([pdf.buffer], { type: "application/pdf" });
    } catch (error) {
      console.error("Error in generate function:", error);
      throw error;
    }
  };

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
                
                console.log("Preparing to generate PDF with signature data");
                
                // Transform the template to fix signature fields
                // This is critical - the schema defines them as text but they should be signature type
                if (data.template && data.template.schemas && data.template.schemas.length > 0) {
                  const schema = data.template.schemas[0];
                  
                  // Look for signature fields in inputs and transform their schema
                  Object.keys(data.inputs[0]).forEach(fieldKey => {
                    const value = data.inputs[0][fieldKey];
                    
                    // Check if this is a signature field by examining the value (data URL)
                    if (typeof value === 'string' && value.startsWith('data:image/')) {
                      console.log(`Found signature data in field: ${fieldKey}, transforming schema type`);
                      
                      // If this field exists in the schema as text type, change it to signature type
                      if (schema[fieldKey] && schema[fieldKey].type === 'text') {
                        console.log(`Transforming schema for ${fieldKey} from text to signature type`);
                        schema[fieldKey].type = 'signature';
                        
                        // Make sure it has appropriate dimensions if not already set
                        if (!schema[fieldKey].width || schema[fieldKey].width < 50) {
                          schema[fieldKey].width = 170;
                        }
                        if (!schema[fieldKey].height || schema[fieldKey].height < 20) {
                          schema[fieldKey].height = 38;
                        }
                      }
                    }
                  });
                  
                  console.log("Schema transformation complete for signature fields");
                }
              }

              // Generate PDF
              const blob = await generate(data);

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
}

export default FormEditor;
