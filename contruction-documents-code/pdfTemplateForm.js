"use client";

import { getFontsData, getPlugins } from "./helper";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Form } from "@pdfme/ui";
import dayjs from "dayjs";
import styles from "@/styles/components/pdfEditor.module.scss";
import Button from "../button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  MobileStepper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Fab,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import SignaturePad from "signature_pad";
import { toast } from "react-toastify";
import SaveIcon from "@mui/icons-material/Save";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CreateIcon from "@mui/icons-material/Create";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  getLanguageFromCountryCode,
  languageTranslations,
} from "@/lib/utils/languageMappings";

const headerHeight = 150;

const FormField = React.memo(
  ({ field, value, onChange }) => {
    const [localValue, setLocalValue] = useState(value || "");

    // Update local value when prop value changes
    useEffect(() => {
      setLocalValue(value || "");
    }, [value]);

    const handleChange = useCallback((e) => {
      setLocalValue(e.target.value);
    }, []);

    const handleBlur = useCallback(() => {
      onChange(field.key, localValue);
    }, [field.key, localValue, onChange]);

    const fieldLabel = useMemo(() => {
      return field.key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .trim();
    }, [field.key]);

    return (
      <TextField
        label={fieldLabel}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        margin="normal"
        sx={{ mb: 2 }}
      />
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if the value actually changed
    return prevProps.value === nextProps.value;
  }
);

FormField.displayName = "FormField";

const StepperContent = React.memo(
  ({ steps, activeStep, formData, template }) => {
    const getStepLabel = useMemo(() => {
      return (stepType) => {
        if (!template?.schemas?.[0]) return stepType;

        const fieldsOfType = Object.entries(template.schemas[0])
          .filter(([_, value]) => (value.type || "text") === stepType)
          .map(([key]) => key);

        const filledFields = fieldsOfType.filter((key) =>
          formData[key]?.trim?.()
        );
        const totalFields = fieldsOfType.length;

        const baseLabel = stepType.charAt(0).toUpperCase() + stepType.slice(1);
        if (totalFields === 0) return baseLabel;

        return `${baseLabel} (${filledFields.length}/${totalFields})`;
      };
    }, [template, formData]);

    const isStepComplete = useCallback(
      (stepType) => {
        if (!template?.schemas?.[0]) return false;

        const fieldsOfType = Object.entries(template.schemas[0]).filter(
          ([_, value]) => (value.type || "text") === stepType
        );

        return fieldsOfType.every(([key]) => formData[key]?.trim?.());
      },
      [formData, template]
    );

    return (
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label} completed={isStepComplete(label)}>
            <StepLabel>{getStepLabel(label)}</StepLabel>
          </Step>
        ))}
      </Stepper>
    );
  }
);

StepperContent.displayName = "StepperContent";

const MobileStepperContent = React.memo(
  ({ steps, activeStep, handleNext, handleBack }) => {
    return (
      <MobileStepper
        variant="text"
        steps={steps.length}
        position="static"
        activeStep={activeStep}
        nextButton={
          <Button
            size="small"
            onClick={handleNext}
            disabled={activeStep === steps.length - 1}
          >
            Next
          </Button>
        }
        backButton={
          <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
            Back
          </Button>
        }
      />
    );
  }
);

MobileStepperContent.displayName = "MobileStepperContent";

const QuickFillDialog = React.memo(
  ({
    open,
    onClose,
    steps,
    activeStep,
    formData,
    template,
    handleNext,
    handleBack,
    handleQuickFill,
    signature,
    setSignature,
    isMobile,
    FormFields,
  }) => {
    const canvasRef = useRef(null);
    const signaturePadRef = useRef(null);

    // Initialize signature pad once when canvas is ready
    useEffect(() => {
      if (canvasRef.current && !signaturePadRef.current) {
        const canvas = canvasRef.current;

        // Set canvas size
        canvas.style.width = "100%";
        canvas.style.height = "200px";
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Initialize signature pad
        signaturePadRef.current = new SignaturePad(canvas, {
          backgroundColor: "rgb(255, 255, 255)",
          penColor: "rgb(0, 0, 0)",
          minWidth: 1,
          maxWidth: 2.5,
        });

        if (setSignature) {
          setSignature(signaturePadRef.current);
        }
      }
    }, [setSignature]);

    // Clear signature pad when dialog closes
    useEffect(() => {
      if (!open && signaturePadRef.current) {
        signaturePadRef.current.clear();
      }
    }, [open, setSignature]);

    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            Quick Fill Form
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {!isMobile ? (
            <StepperContent
              steps={steps}
              activeStep={activeStep}
              formData={formData}
              template={template}
            />
          ) : (
            <MobileStepperContent
              steps={steps}
              activeStep={activeStep}
              handleNext={handleNext}
              handleBack={handleBack}
            />
          )}

          <Box sx={{ mt: 2 }}>
            {steps[activeStep] === "signature" ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Please sign below
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    height: "200px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    style={{
                      width: "100%",
                      height: "100%",
                      touchAction: "none",
                    }}
                  />
                </Box>
                <Button
                  onClick={() => signaturePadRef.current?.clear()}
                  variant="outlined"
                  size="small"
                >
                  Clear Signature
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormFields type={steps[activeStep]} />
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button onClick={handleBack} disabled={activeStep === 0}>
              Back
            </Button>
            <Button
              onClick={
                activeStep === steps.length - 1 ? handleQuickFill : handleNext
              }
              variant="contained"
            >
              {activeStep === steps.length - 1 ? "Complete" : "Next"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }
);

QuickFillDialog.displayName = "QuickFillDialog";

const SignatureDialog = ({ open, onClose, onSave, translations }) => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && !signaturePadRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 500;
      canvas.height = 200;

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
      });
    }
  }, []);

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureData = signaturePadRef.current.toDataURL();
      onSave(signatureData);
      onClose();
    }
  };

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{translations.signature}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
            p: 2,
          }}
        >
          <Typography>{translations.selectSignatureField}</Typography>
          <Box sx={{ border: "1px solid #ccc", borderRadius: 1 }}>
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "200px", touchAction: "none" }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={handleClear}>{translations.clearSignature}</Button>
            <Button onClick={handleSave} bgc="#00b341">
              {translations.saveAndNext}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

SignatureDialog.displayName = "SignatureDialog";

const SignatureCollectorModal = React.memo(
  ({ open, onClose, template, formData, onSignaturesSave, translations }) => {
    const [signatures, setSignatures] = useState({});
    const canvasRef = useRef(null);
    const signaturePadRef = useRef(null);
    const [activeSignatureField, setActiveSignatureField] = useState(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [hasCurrentSignature, setHasCurrentSignature] = useState(false);
    const prevFields = useRef([]);
    const prevTemplate = useRef(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Reset signatures when template changes
    useEffect(() => {
      if (prevTemplate.current && prevTemplate.current !== template) {
        setSignatures({});
        setActiveSignatureField(null);
        setHasCurrentSignature(false);
        if (signaturePadRef.current) {
          signaturePadRef.current.clear();
        }
      }
      prevTemplate.current = template;
    }, [template]);

    // Reset when modal is closed
    useEffect(() => {
      if (!open) {
        setSignatures({});
        setActiveSignatureField(null);
        setHasCurrentSignature(false);
        if (signaturePadRef.current) {
          signaturePadRef.current.clear();
        }
      }
    }, [open]);

    // Get all signature fields from template and group by page
    const signatureFields = useMemo(() => {
      if (!template?.schemas?.[0]) return [];

      // Create a promise that resolves when elements are found
      const waitForElements = () => {
        return new Promise((resolve) => {
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max (50 * 100ms)

          const checkElements = () => {
            const paperElements = document.querySelectorAll(
              '[id^="@pdfme/ui-paper"]'
            );
            const allElements = document.querySelectorAll("[title]");
            console.log(
              `Attempt ${attempts + 1}: Found ${
                paperElements.length
              } paper elements and ${allElements.length} titled elements`
            );

            if (paperElements.length > 0 && allElements.length > 0) {
              // Elements found, collect field information
              const domFields = new Map();

              allElements.forEach((element) => {
                const title = element.getAttribute("title");
                const paperContainer = element.closest(
                  '[id^="@pdfme/ui-paper"]'
                );
                if (paperContainer) {
                  const paperIdMatch = paperContainer.id.match(/paper(\d+)/);
                  if (paperIdMatch) {
                    const pageNum = parseInt(paperIdMatch[1]) + 1;

                    // Check if it's a signature field
                    const schemaField = template.schemas[0][title];
                    const isSignature =
                      schemaField?.type === "signature" ||
                      schemaField?.type === "signature_image" ||
                      title.toLowerCase().includes("field");

                    if (isSignature) {
                      domFields.set(title, {
                        key: title,
                        type: "signature",
                        position: {
                          x: parseFloat(element.style.left) || 0,
                          y: parseFloat(element.style.top) || 0,
                        },
                        width: 62.5,
                        height: 37.5,
                        page: pageNum,
                        foundInDOM: true,
                        paperContainerId: paperContainer.id,
                      });
                    }
                  }
                }
              });

              resolve(domFields);
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkElements, 100);
            } else {
              // If elements aren't found after max attempts, fall back to schema-only fields
              console.log("Falling back to schema-only fields");
              resolve(new Map());
            }
          };

          checkElements();
        });
      };

      // Start checking for elements and update state when found
      waitForElements().then((domFields) => {
        // Add fields from schema that might not be in DOM yet
        Object.entries(template.schemas[0])
          .filter(
            ([_, value]) =>
              value.type === "signature" || value.type === "signature_image"
          )
          .forEach(([key, value]) => {
            if (!domFields.has(key)) {
              const pageHeight = 841.89;
              const pageNum = Math.floor(value.position.y / pageHeight) + 1;

              domFields.set(key, {
                key,
                ...value,
                page: pageNum,
                foundInDOM: false,
              });
            }
          });

        // Convert to array and sort
        const allFields = Array.from(domFields.values())
          .sort((a, b) => {
            if (a.page !== b.page) return a.page - b.page;
            return a.position.y - b.position.y;
          })
          .map((field) => ({
            ...field,
            label: `${field.key
              .replace(/_/g, " ")
              .replace(/([A-Z])/g, " $1")
              .trim()} (${translations?.page || "Page"} ${field.page})`,
          }));

        console.log("All detected signature fields:", allFields);
        return allFields;
      });

      // Return initial fields from schema while waiting for DOM
      const initialFields = Object.entries(template.schemas[0])
        .filter(
          ([_, value]) =>
            value.type === "signature" || value.type === "signature_image"
        )
        .map(([key, value]) => {
          const pageHeight = 841.89;
          const pageNum = Math.floor(value.position.y / pageHeight) + 1;

          return {
            key,
            ...value,
            page: pageNum,
            foundInDOM: false,
            label: `${key
              .replace(/_/g, " ")
              .replace(/([A-Z])/g, " $1")
              .trim()} (${translations?.page || "Page"} ${pageNum})`,
          };
        })
        .sort((a, b) => {
          if (a.page !== b.page) return a.page - b.page;
          return a.position.y - b.position.y;
        });

      return initialFields;
    }, [template, translations]);

    // Add state for dynamic signature fields
    const [dynamicSignatureFields, setDynamicSignatureFields] = useState([]);

    // Effect to poll for new signature fields
    useEffect(() => {
      let mounted = true;
      let pollCount = 0;
      const foundFields = new Set();
      const maxPolls = 50; // Increased max polls for better detection
      const pollInterval = 300; // Increased interval for better stability

      const isSignatureField = (element) => {
        const title = element.getAttribute("title") || "";

        // Check for the specific signature field structure
        const hasXButton = !!element.querySelector("button");
        const canvas = element.querySelector("canvas");
        const hasCanvas = !!canvas;
        const hasContentEditable = !!element.querySelector("[contenteditable]");
        const isSelectable = element.classList.contains("selectable");

        // Get dimensions
        const rect = element.getBoundingClientRect();

        // Check for canvas with touch-action and user-select styles
        const hasSignatureCanvasStyles =
          canvas?.style?.touchAction === "none" &&
          canvas?.style?.userSelect === "none";

        // More flexible dimension check
        const hasSignatureDimensions = rect.width >= 30 && rect.height >= 30;

        // Check if it's explicitly marked as a signature field in the schema
        const schemaField = template?.schemas?.[0]?.[title];
        const isSignatureInSchema =
          schemaField?.type === "signature" ||
          schemaField?.type === "signature_image" ||
          title.toLowerCase().includes("signature") ||
          title.toLowerCase().includes("field") || // Added to catch field1, field2, etc.
          title.toLowerCase().includes("חתימה");

        // More inclusive field detection that matches the specific structure
        const isSignatureField =
          isSelectable &&
          hasCanvas &&
          !hasContentEditable &&
          (hasXButton || hasSignatureCanvasStyles || isSignatureInSchema) &&
          hasSignatureDimensions;

        console.log("Checking field:", {
          title,
          hasCanvas,
          hasXButton,
          hasSignatureCanvasStyles,
          hasContentEditable,
          dimensions: { width: rect.width, height: rect.height },
          isSignatureInSchema,
          isSignatureField,
          isSelectable,
          elementHtml: element.outerHTML.slice(0, 200), // Log the first 200 chars of HTML for debugging
        });

        return isSignatureField;
      };

      const pollForFields = async () => {
        if (!mounted || pollCount >= maxPolls) {
          console.log("Polling stopped:", { pollCount, maxPolls, mounted });
          return;
        }

        pollCount++;
        console.log(`Polling attempt ${pollCount}`);

        // Get all paper containers and the PDF container
        const paperElements = Array.from(
          document.querySelectorAll('[id^="@pdfme/ui-paper"]')
        );
        const pdfContainer = document.querySelector(`.${styles.viewer}`);

        // Calculate expected number of pages from schema
        const expectedPages = template?.basePdf?.pages || 1;

        console.log("Found elements:", {
          paperElements: paperElements.length,
          expectedPages,
          containerFound: !!pdfContainer,
        });

        // Wait for all pages to be rendered
        if (paperElements.length < expectedPages) {
          console.log(
            `Waiting for all pages to render (${paperElements.length}/${expectedPages})`
          );
          setTimeout(pollForFields, pollInterval);
          return;
        }

        if (paperElements.length > 0 && pdfContainer) {
          const fields = [];
          let foundNewField = false;

          // Save original scroll position
          const originalScrollTop = pdfContainer.scrollTop;

          try {
            // Scroll through each page to ensure all elements are rendered
            for (const [index, paperElement] of paperElements.entries()) {
              // Scroll to this page
              pdfContainer.scrollTo({
                top: paperElement.offsetTop,
                behavior: "instant",
              });

              // Wait longer for pages further down in the document
              // This helps with larger documents where rendering might take longer
              const waitTime = Math.min(100 + index * 50, 500); // Increases with each page, max 500ms
              await new Promise((resolve) => setTimeout(resolve, waitTime));

              // Get selectable elements for this page
              const selectableElements = Array.from(
                paperElement.querySelectorAll(".selectable")
              );
              console.log(
                `Checking page ${paperElement.id} (${index + 1}/${
                  paperElements.length
                }), found ${selectableElements.length} selectable elements`
              );

              // Process selectable elements
              for (const element of selectableElements) {
                const title = element.getAttribute("title");
                if (foundFields.has(title)) continue;

                if (isSignatureField(element)) {
                  const paperIdMatch = paperElement.id.match(/paper(\d+)/);
                  if (!paperIdMatch) continue;

                  // Calculate the actual page number based on the element's position in the document
                  const pageNum = (() => {
                    // First try to get page number from the schema if available
                    const schemaField = template?.schemas?.[0]?.[title];
                    if (schemaField?.position?.y) {
                      // PDF page height is typically 841.89 points
                      const pageHeight = 841.89;
                      const calculatedPage =
                        Math.floor(schemaField.position.y / pageHeight) + 1;
                      console.log(`Calculated page from schema for ${title}:`, {
                        y: schemaField.position.y,
                        calculatedPage,
                        schemaField,
                      });
                      return calculatedPage;
                    }

                    // If not in schema, use the current page index
                    return index + 1;
                  })();

                  const elementRect = element.getBoundingClientRect();
                  const paperRect = paperElement.getBoundingClientRect();

                  // Only process if element has valid dimensions
                  if (elementRect.width > 0 && elementRect.height > 0) {
                    const relativeTop = elementRect.top - paperRect.top;
                    const relativeLeft = elementRect.left - paperRect.left;

                    console.log("Found signature field:", {
                      title,
                      page: pageNum,
                      schemaPosition: template?.schemas?.[0]?.[title]?.position,
                      domPosition: {
                        paperIndex: Array.from(
                          document.querySelectorAll('[id^="@pdfme/ui-paper"]')
                        ).indexOf(paperElement),
                        relativeTop,
                        relativeLeft,
                      },
                      dimensions: {
                        width: elementRect.width,
                        height: elementRect.height,
                      },
                    });

                    foundFields.add(title);
                    foundNewField = true;
                    fields.push({
                      key: title,
                      type: "signature",
                      position: {
                        x: relativeLeft,
                        y: relativeTop,
                      },
                      width: elementRect.width,
                      height: elementRect.height,
                      page: pageNum,
                      foundInDOM: true,
                      paperContainerId: paperElement.id,
                      label: `${title
                        .replace(/_/g, " ")
                        .replace(/([A-Z])/g, " $1")
                        .trim()} (Page ${pageNum})`,
                    });
                  }
                }
              }

              // Add a small delay after processing each page
              await new Promise((resolve) => setTimeout(resolve, 50));
            }

            // Restore original scroll position with smooth scrolling
            pdfContainer.scrollTo({
              top: originalScrollTop,
              behavior: "smooth",
            });

            if (mounted && foundNewField) {
              console.log("Adding signature fields:", fields);
              setDynamicSignatureFields((prev) => {
                const newFields = [...prev];
                fields.forEach((field) => {
                  if (!newFields.some((f) => f.key === field.key)) {
                    newFields.push(field);
                  }
                });
                return newFields;
              });
            }
          } catch (error) {
            console.error("Error during field detection:", error);
            // Ensure we restore scroll position even if there's an error
            pdfContainer.scrollTo({
              top: originalScrollTop,
              behavior: "instant",
            });
          }

          // Continue polling if needed and no fields found yet
          if (pollCount < maxPolls && foundFields.size === 0) {
            setTimeout(pollForFields, pollInterval);
          }
        } else {
          // If no paper elements found yet, continue polling
          setTimeout(pollForFields, pollInterval);
        }
      };

      // Make pollForFields async
      const startPolling = () => {
        console.log("Starting signature field detection...");
        pollForFields().catch(console.error);
      };

      // Start polling with initial delay to allow for rendering
      const initialDelay = setTimeout(() => {
        console.log("Starting signature field detection...");
        pollForFields().catch(console.error);
      }, 1000);

      return () => {
        mounted = false;
        clearTimeout(initialDelay);
      };
    }, [template?.schemas, open]);

    // Combine static and dynamic fields with memoization to prevent unnecessary rerenders
    const allSignatureFields = useMemo(() => {
      const combined = [...signatureFields, ...dynamicSignatureFields];
      const uniqueFields = Array.from(
        new Map(combined.map((field) => [field.key, field])).values()
      );
      const sorted = uniqueFields.sort((a, b) => {
        if (a.page !== b.page) return a.page - b.page;
        return a.position.y - b.position.y;
      });

      // Only log when fields actually change
      if (JSON.stringify(sorted) !== JSON.stringify(prevFields.current)) {
        console.log("Signature fields updated:", sorted);
        prevFields.current = sorted;
      }

      return sorted;
    }, [signatureFields, dynamicSignatureFields]);

    // Group signature fields by page for display
    const signatureFieldsByPage = useMemo(() => {
      const grouped = allSignatureFields.reduce((acc, field) => {
        const page = field.page || 1;
        if (!acc[page]) {
          acc[page] = [];
        }
        acc[page].push(field);
        return acc;
      }, {});

      // Ensure pages are ordered numerically
      const orderedGrouped = {};
      Object.keys(grouped)
        .sort((a, b) => Number(a) - Number(b))
        .forEach((key) => {
          orderedGrouped[key] = grouped[key];
        });

      console.log("Final grouped fields by page:", orderedGrouped);
      return orderedGrouped;
    }, [allSignatureFields]);

    // Auto-select first unsigned field when opening modal
    useEffect(() => {
      if (open && allSignatureFields.length > 0) {
        // Find first unsigned field
        const firstUnsignedField = allSignatureFields.find(
          (field) => !signatures[field.key]
        );
        if (firstUnsignedField) {
          setActiveSignatureField(firstUnsignedField.key);
          // If it's not on the first page, show notification
          if (firstUnsignedField.page > 1) {
            toast.info(
              `${translations?.signatureRequired || "Signature required"} ${
                translations?.page || "Page"
              } ${firstUnsignedField.page}`,
              {
                position: "top-center",
                autoClose: 2000,
              }
            );
          }
        } else {
          // If all fields are signed, select the first one
          setActiveSignatureField(allSignatureFields[0].key);
        }
      }
    }, [open, allSignatureFields, signatures, translations]);

    // Initialize signature pad when canvas is ready
    const initSignaturePad = useCallback(() => {
      if (!canvasRef.current || signaturePadRef.current) return;

      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      const { width, height } = container.getBoundingClientRect();

      // Set canvas size based on container
      canvas.width = width;
      canvas.height = height;
      setCanvasSize({ width, height });

      // Initialize SignaturePad with improved settings
      signaturePadRef.current = new SignaturePad(canvas, {
        minWidth: 1,
        maxWidth: 2.5,
        penColor: "#0047AB",
        backgroundColor: "rgba(255, 255, 255, 0)",
        throttle: 16,
        velocityFilterWeight: 0.7,
      });

      // Enable drawing and add event listeners
      signaturePadRef.current.on();
      signaturePadRef.current.addEventListener("endStroke", () => {
        setHasCurrentSignature(!signaturePadRef.current.isEmpty());
      });
    }, []);

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        if (!canvasRef.current || !signaturePadRef.current) return;

        const container = canvasRef.current.parentElement;
        const { width, height } = container.getBoundingClientRect();

        if (width !== canvasSize.width || height !== canvasSize.height) {
          // Save current signature data
          const signatureData = signaturePadRef.current.isEmpty()
            ? null
            : signaturePadRef.current.toDataURL();

          // Resize canvas
          canvasRef.current.width = width;
          canvasRef.current.height = height;
          setCanvasSize({ width, height });

          // Restore signature if existed
          if (signatureData) {
            signaturePadRef.current.fromDataURL(signatureData);
          }
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [canvasSize]);

    // Initialize or cleanup signature pad
    useEffect(() => {
      if (open) {
        // Initialize on next tick to ensure container is rendered
        setTimeout(initSignaturePad, 0);
      }

      return () => {
        if (signaturePadRef.current) {
          signaturePadRef.current.off();
          signaturePadRef.current = null;
        }
      };
    }, [open, initSignaturePad]);

    // Load existing signatures
    useEffect(() => {
      if (formData && Object.keys(formData).length > 0) {
        const existingSignatures = {};
        allSignatureFields.forEach((field) => {
          if (formData[field.key]) {
            existingSignatures[field.key] = formData[field.key];
          }
        });
        setSignatures(existingSignatures);
      }
    }, [formData, allSignatureFields]);

    // Handle field selection
    const handleFieldSelect = useCallback((fieldKey) => {
      setActiveSignatureField(fieldKey);
      if (signaturePadRef.current) {
        signaturePadRef.current.clear();
        setHasCurrentSignature(false);
      }

      // Find and scroll to the signature field in the PDF
      setTimeout(() => {
        const signatureElement = document.querySelector(
          `[title="${fieldKey}"]`
        );
        if (signatureElement) {
          // Find the PDF viewer container
          const pdfContainer = document.querySelector(`.${styles.viewer}`);
          const paperContainer = signatureElement.closest(
            '[id^="@pdfme/ui-paper"]'
          );

          if (pdfContainer && paperContainer) {
            // Calculate the scroll position
            const containerRect = pdfContainer.getBoundingClientRect();
            const elementRect = signatureElement.getBoundingClientRect();
            const paperRect = paperContainer.getBoundingClientRect();

            // Calculate the scroll position to center the element
            const scrollTop =
              paperRect.top +
              pdfContainer.scrollTop -
              containerRect.top -
              (containerRect.height - elementRect.height) / 2;

            // Smooth scroll to the element
            pdfContainer.scrollTo({
              top: scrollTop,
              behavior: "smooth",
            });

            // Add highlight animation to the field
            signatureElement.style.transition = "all 0.3s ease";
            signatureElement.style.boxShadow =
              "0 0 0 4px rgba(33, 150, 243, 0.4)";
            signatureElement.style.borderRadius = "4px";
            signatureElement.style.zIndex = "1000";

            // Remove highlight after animation
            setTimeout(() => {
              signatureElement.style.boxShadow = "none";
              signatureElement.style.zIndex = "";
            }, 2000);
          }
        }
      }, 100);
    }, []);

    const handleClear = useCallback(() => {
      if (signaturePadRef.current) {
        signaturePadRef.current.clear();
        setHasCurrentSignature(false);
      }
    }, []);

    const handleSave = useCallback(() => {
      if (
        signaturePadRef.current &&
        !signaturePadRef.current.isEmpty() &&
        activeSignatureField
      ) {
        // Get the canvas and create a temporary canvas for processing
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        // Set the temporary canvas to the same size
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;

        // Draw the signature on the temporary canvas
        tempCtx.drawImage(canvas, 0, 0);

        // Get the signature bounds
        const imageData = tempCtx.getImageData(
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );
        const bounds = getSignatureBounds(imageData);

        if (bounds) {
          // Create a new canvas with just the signature
          const signatureCanvas = document.createElement("canvas");
          const signatureCtx = signatureCanvas.getContext("2d");

          // Add some padding around the signature
          const padding = 10;
          signatureCanvas.width = bounds.width + padding * 2;
          signatureCanvas.height = bounds.height + padding * 2;

          // Make the background transparent
          signatureCtx.clearRect(
            0,
            0,
            signatureCanvas.width,
            signatureCanvas.height
          );

          // Draw only the signature portion
          signatureCtx.drawImage(
            tempCanvas,
            bounds.left,
            bounds.top,
            bounds.width,
            bounds.height,
            padding,
            padding,
            bounds.width,
            bounds.height
          );

          // Convert to PNG with transparency
          const signatureData = signatureCanvas.toDataURL("image/png", 1.0);

          const newSignatures = {
            ...signatures,
            [activeSignatureField]: signatureData,
          };
          setSignatures(newSignatures);

          signaturePadRef.current.clear();
          setHasCurrentSignature(false);

          // Find next unsigned field across all pages
          const currentField = allSignatureFields.find(
            (f) => f.key === activeSignatureField
          );
          const currentIndex = allSignatureFields.findIndex(
            (f) => f.key === activeSignatureField
          );

          // Find the next unsigned field after the current one
          const nextUnsignedField = allSignatureFields
            .slice(currentIndex + 1)
            .find((field) => !newSignatures[field.key]);

          if (nextUnsignedField) {
            // If there's a next unsigned field, select it
            setActiveSignatureField(nextUnsignedField.key);

            // If it's on a different page, show a notification
            if (nextUnsignedField.page !== currentField.page) {
              toast.info(`עובר לחתימה בעמוד ${nextUnsignedField.page}`, {
                position: "top-center",
                autoClose: 2000,
              });
            }
          } else {
            // If no more unsigned fields, save and close
            onSignaturesSave(newSignatures);
            onClose();
          }
        }
      }
    }, [
      activeSignatureField,
      allSignatureFields,
      signatures,
      onSignaturesSave,
      onClose,
    ]);

    // Add handleSignAll function
    const handleSignAll = useCallback(() => {
      if (
        signaturePadRef.current &&
        !signaturePadRef.current.isEmpty() &&
        activeSignatureField
      ) {
        // Get the canvas and create a temporary canvas for processing
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        // Set the temporary canvas to the same size
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;

        // Draw the signature on the temporary canvas
        tempCtx.drawImage(canvas, 0, 0);

        // Get the signature bounds
        const imageData = tempCtx.getImageData(
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );
        const bounds = getSignatureBounds(imageData);

        if (bounds) {
          // Create a new canvas with just the signature
          const signatureCanvas = document.createElement("canvas");
          const signatureCtx = signatureCanvas.getContext("2d");

          // Add some padding around the signature
          const padding = 10;
          signatureCanvas.width = bounds.width + padding * 2;
          signatureCanvas.height = bounds.height + padding * 2;

          // Make the background transparent
          signatureCtx.clearRect(
            0,
            0,
            signatureCanvas.width,
            signatureCanvas.height
          );

          // Draw only the signature portion
          signatureCtx.drawImage(
            tempCanvas,
            bounds.left,
            bounds.top,
            bounds.width,
            bounds.height,
            padding,
            padding,
            bounds.width,
            bounds.height
          );

          // Convert to PNG with transparency
          const signatureData = signatureCanvas.toDataURL("image/png", 1.0);

          // Apply the signature to all unsigned fields across all pages
          const newSignatures = { ...signatures };
          allSignatureFields.forEach((field) => {
            if (!newSignatures[field.key]) {
              newSignatures[field.key] = signatureData;
            }
          });

          setSignatures(newSignatures);
          signaturePadRef.current.clear();
          setHasCurrentSignature(false);

          // Save and close since all fields are now signed
          onSignaturesSave(newSignatures);
          onClose();
        }
      }
    }, [
      activeSignatureField,
      allSignatureFields,
      signatures,
      onSignaturesSave,
      onClose,
    ]);

    // Helper function to find the bounds of the signature
    const getSignatureBounds = (imageData) => {
      const width = imageData.width;
      const height = imageData.height;
      const data = imageData.data;

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;

      // Scan through the image data to find the signature bounds
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > 0) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      // Check if we found any signature
      if (maxX >= 0) {
        return {
          left: minX,
          top: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
        };
      }

      return null;
    };

    const handleComplete = useCallback(() => {
      if (Object.keys(signatures).length > 0) {
        onSignaturesSave(signatures);
        onClose();
      }
    }, [signatures, onSignaturesSave, onClose]);

    // Monitor signature pad for changes
    useEffect(() => {
      if (signaturePadRef.current) {
        const checkSignature = () => {
          setHasCurrentSignature(!signaturePadRef.current.isEmpty());
        };

        signaturePadRef.current.addEventListener("endStroke", checkSignature);
        return () => {
          signaturePadRef.current?.removeEventListener(
            "endStroke",
            checkSignature
          );
        };
      }
    }, []);

    // Add this function at the component level to manage signature numbering
    const getSignatureNumber = useCallback((fields, currentIndex) => {
      return currentIndex + 1;
    }, []);

    // Add animation keyframes at the top of the component
    const buttonAnimationKeyframes = `
      @keyframes pulseButton {
        0% {
          transform: scale(1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(33, 150, 243, 0.3);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      }
    `;

    // Add style tag for animation
    useEffect(() => {
      const style = document.createElement("style");
      style.textContent = buttonAnimationKeyframes;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }, [buttonAnimationKeyframes]);

    const renderSignatureButton = (field, index) => {
      const isActive = activeSignatureField === field.key;
      const isSigned = signatures[field.key];
      const globalIndex = index + 1;

      return (
        <Button
          key={field.key}
          onClick={() => handleFieldSelect(field.key)}
          h={64}
          w="100%"
          bgc={isSigned ? "#e8f5e9" : isActive ? "#2196f3" : "white"}
          fc={isActive ? "white" : isSigned ? "#2e7d32" : "#1f2937"}
          brs={8}
          fw={500}
          customStyles={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            border: `1px solid ${
              isSigned ? "#4caf50" : isActive ? "#2196f3" : "#e0e0e0"
            }`,
            boxShadow: isActive ? "0 2px 8px rgba(33, 150, 243, 0.25)" : "none",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: isSigned
                ? "#c8e6c9"
                : isActive
                ? "#1976d2"
                : "#f5f5f5",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minWidth: 0,
              flex: 1,
            }}
          >
            {isSigned && (
              <CheckCircleIcon
                sx={{
                  color: "#4caf50",
                  fontSize: "20px",
                  flexShrink: 0,
                }}
              />
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: "inherit",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {translations.signature || "Signature"} {globalIndex}
                </Typography>
                {isActive && !isSigned && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: isActive
                        ? "rgba(255,255,255,0.8)"
                        : "primary.main",
                      fontSize: "0.75rem",
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.1)"
                        : "primary.lighter",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      flexShrink: 0,
                    }}
                  >
                    {translations.current || "Current"}
                  </Typography>
                )}
              </Box>
              {/* Optional: Add page number for mobile */}
              <Typography
                variant="caption"
                sx={{
                  display: { xs: "block", sm: "none" },
                  color: isActive ? "rgba(255,255,255,0.6)" : "text.secondary",
                  mt: 0.5,
                }}
              >
                {translations.page || "Page"} {field.page || 1}
              </Typography>
            </Box>
          </Box>
          {isSigned && (
            <Box
              sx={{
                backgroundColor: "#4caf50",
                color: "white",
                fontSize: "0.75rem",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 500,
                ml: 1,
                flexShrink: 0,
              }}
            >
              {translations.signed || "Signed"}
            </Box>
          )}
        </Button>
      );
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: styles.signatureModalDialog,
        }}
      >
        <Box className={styles.signatureModalHeader}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography className={styles.signatureModalHeaderTitle}>
              {translations.signaturesCompleted} (
              {Object.keys(signatures).length}/{allSignatureFields.length})
            </Typography>
            <IconButton onClick={onClose} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>
          {isMobile && (
            <Box className={styles.signatureModalHeaderProgress}>
              <Box
                className={styles.signatureModalHeaderProgressBar}
                sx={{
                  width: `${
                    (Object.keys(signatures).length /
                      allSignatureFields.length) *
                    100
                  }%`,
                }}
              />
            </Box>
          )}
        </Box>

        <Box className={styles.signatureModalContent}>
          {allSignatureFields.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "300px",
                p: 3,
                textAlign: "center",
              }}
            >
              <CreateIcon
                sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" sx={{ color: "text.primary", mb: 1 }}>
                {translations.noSignaturesFound}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {translations.noSignaturesDescription}
              </Typography>
            </Box>
          ) : (
            <>
              {/* Canvas Section - Always visible */}
              <Box className={styles.signatureModalCanvas}>
                <Typography
                  variant="h6"
                  className={styles.signatureModalCanvasTitle}
                >
                  {activeSignatureField
                    ? `${translations.signature} ${
                        allSignatureFields.findIndex(
                          (field) => field.key === activeSignatureField
                        ) + 1
                      }`
                    : translations.selectSignatureField}
                </Typography>
                <Box className={styles.signatureModalCanvasContainer}>
                  <canvas
                    ref={canvasRef}
                    className={styles.signatureModalCanvasWrapper}
                  />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={handleClear}
                    disabled={!activeSignatureField || !hasCurrentSignature}
                    className={`${styles.signatureModalButton} ${styles.signatureModalButtonClear}`}
                  >
                    {translations.clearSignature}
                  </button>
                  <Box sx={{ flex: 1 }} />
                  <button
                    onClick={handleSignAll}
                    disabled={!activeSignatureField || !hasCurrentSignature}
                    className={`${styles.signatureModalButton} ${styles.signatureModalButtonSignAll}`}
                  >
                    {translations.signAllFields}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!activeSignatureField || !hasCurrentSignature}
                    className={`${styles.signatureModalButton} ${
                      styles.signatureModalButtonSave
                    } ${hasCurrentSignature ? styles.pulse : ""}`}
                  >
                    {Object.keys(signatures).length ===
                      allSignatureFields.length - 1 && hasCurrentSignature
                      ? translations.signAndFinish
                      : translations.saveAndNext}
                  </button>
                </Box>
              </Box>

              {/* Signature Fields List - Hidden on mobile when signing */}
              {(!isMobile || !activeSignatureField) && (
                <Box className={styles.signatureModalSidebar}>
                  {Object.entries(signatureFieldsByPage).map(
                    ([page, fields]) => (
                      <Box key={page} sx={{ p: 2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            mb: 1.5,
                            fontWeight: 600,
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                            bgcolor: "background.paper",
                            p: 1,
                            borderRadius: 1,
                          }}
                        >
                          {translations.page} {page}
                          <Typography
                            component="span"
                            sx={{
                              ml: 1,
                              fontSize: "0.75rem",
                              color: "primary.main",
                              bgcolor: "primary.lighter",
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                            }}
                          >
                            {fields.filter((f) => signatures[f.key]).length}/
                            {fields.length}
                          </Typography>
                        </Typography>

                        {fields.map((field, index) => (
                          <div
                            key={field.key}
                            onClick={() => handleFieldSelect(field.key)}
                            className={`${styles.signatureModalField} ${
                              activeSignatureField === field.key
                                ? styles.signatureModalFieldActive
                                : ""
                            } ${
                              signatures[field.key]
                                ? styles.signatureModalFieldSigned
                                : ""
                            }`}
                          >
                            <div className={styles.signatureModalFieldLabel}>
                              <span>
                                {translations.signature}{" "}
                                {getSignatureNumber(fields, index)}
                              </span>
                              {signatures[field.key] && (
                                <CheckCircleIcon sx={{ fontSize: 20 }} />
                              )}
                            </div>
                            <div className={styles.signatureModalFieldPage}>
                              {translations.page} {field.page}
                            </div>
                          </div>
                        ))}
                      </Box>
                    )
                  )}
                </Box>
              )}
            </>
          )}
        </Box>

        <Box className={styles.signatureModalFooter}>
          <div className={styles.signatureModalProgress}>
            <span className={styles.signatureModalProgressCount}>
              {Object.keys(signatures).length}
            </span>
            {translations.outOf} {allSignatureFields.length}{" "}
            {translations.signaturesCompleted}
          </div>
          <button
            onClick={handleComplete}
            disabled={Object.keys(signatures).length === 0}
            className={`${styles.signatureModalButton} ${styles.signatureModalButtonComplete}`}
          >
            {translations.signAndFinishClose}
          </button>
        </Box>
      </Dialog>
    );
  }
);

SignatureCollectorModal.displayName = "SignatureCollectorModal";

const PDFTemplateForm = ({
  template,
  workerDetails,
  organizationSettings,
  workerAuthorityDetails,
  onSubmit,
  source,
  nextDocId,
  slug,
  countryCode,
}) => {
  // Get language code and translations based on country code
  const languageCode = getLanguageFromCountryCode(countryCode);
  const translations =
    languageTranslations[languageCode] || languageTranslations.en;

  console.log("PDFTemplateForm - countryCode:", countryCode);
  console.log("PDFTemplateForm - languageCode:", languageCode);
  console.log("PDFTemplateForm - translations:", translations);

  const designerRef = useRef(null);
  const designer = useRef(null);
  const [isDesignerReady, setIsDesignerReady] = useState(false);
  const [openQuickFill, setOpenQuickFill] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [signature, setSignature] = useState(null);
  const [steps, setSteps] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSignatureCollector, setShowSignatureCollector] = useState(false);

  console.log("in PDFTemplateForm");

  useEffect(() => {
    if (template?.schemas?.[0]) {
      const fields = Object.entries(template.schemas[0]).map(
        ([key, value]) => ({
          key,
          ...value,
        })
      );

      // Group fields by type and sort by position
      const groupedFields = fields.reduce((acc, field) => {
        const type = field.type || "text";
        if (!acc[type]) acc[type] = [];
        acc[type].push(field);
        return acc;
      }, {});

      // Sort fields within each group by vertical position
      Object.keys(groupedFields).forEach((type) => {
        groupedFields[type].sort((a, b) => a.position.y - b.position.y);
      });

      // Set steps only for field types that exist in the template
      const newSteps = Object.keys(groupedFields);
      setSteps(newSteps);

      console.log("Template Fields:", fields);
      console.log("Grouped Fields:", groupedFields);

      // Initialize form data with values from the PDF elements
      const initialFormData = {};

      // Wait a bit for the PDF elements to be rendered
      setTimeout(() => {
        fields.forEach((field) => {
          // Find the element by title attribute
          const element = document.querySelector(
            `[title="${field.key}"] [contenteditable]`
          );
          if (element) {
            initialFormData[field.key] = element.textContent.trim();
          } else {
            initialFormData[field.key] = "";
          }
        });

        console.log("Initial Form Data from Elements:", initialFormData);
        setFormData(initialFormData);

        // Update designer inputs if available
        if (designer.current) {
          designer.current.setInputs([initialFormData]);
        }
      }, 500);
    }
  }, [template]);

  // Add a new effect to update formData when designer is ready
  useEffect(() => {
    if (designer.current) {
      // Read values from PDF elements
      const currentFormData = {};
      const elements = document.querySelectorAll("[contenteditable]");

      elements.forEach((element) => {
        const fieldContainer = element.closest(".selectable");
        if (fieldContainer) {
          const fieldName = fieldContainer.getAttribute("title");
          if (fieldName) {
            currentFormData[fieldName] = element.textContent.trim();
          }
        }
      });

      console.log("Values from PDF elements:", currentFormData);
      setFormData(currentFormData);
      designer.current.setInputs([currentFormData]);
    }
  }, [isDesignerReady]);

  const handleFieldChange = useCallback((key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Update the designer input
    if (designer.current) {
      const currentInputs = designer.current.getInputs()[0];
      designer.current.setInputs([
        {
          ...currentInputs,
          [key]: value,
        },
      ]);
    }
  }, []);

  const getFieldsByType = useCallback(
    (type) => {
      if (!template?.schemas?.[0]) return [];

      return Object.entries(template.schemas[0])
        .filter(([_, value]) => (value.type || "text") === type)
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => a.position.y - b.position.y);
    },
    [template]
  );

  const FormFields = React.memo(
    ({ type }) => {
      const fields = useMemo(() => {
        const typeFields = getFieldsByType(type);
        return typeFields.sort((a, b) => {
          const yDiff = a.position.y - b.position.y;
          if (yDiff !== 0) return yDiff;
          return a.position.x - b.position.x;
        });
      }, [type]);

      return (
        <>
          {fields.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={formData[field.key] || ""}
              onChange={handleFieldChange}
            />
          ))}
        </>
      );
    },
    (prevProps, nextProps) => {
      // Only re-render if the type changes
      return prevProps.type === nextProps.type;
    }
  );

  FormFields.displayName = "FormFields";

  const buildInputs = useCallback(() => {
    const baseInputs = {
      worker_first_name: workerDetails?.firstName || "",
      worker_last_name: workerDetails?.lastName || "",
      worker_full_name: `${workerDetails?.firstName || ""} ${
        workerDetails?.lastName || ""
      }`,
      worker_serial_number: workerDetails?.serialNumber?.toString() || "",
      worker_prev_serial_number:
        workerDetails?.prevSerialNumber?.toString() || "",
      worker_start_date: dayjs(workerDetails?.contractStartDate).format(
        "DD/MM/YYYY"
      ),
      firstIsraelEntryDate: dayjs(workerDetails?.firstIsraelEntryDate).format(
        "DD/MM/YYYY"
      ),

      contractTerminationDate: dayjs(
        workerDetails?.contractTerminationDate
      ).format("DD/MM/YYYY"),
      escapeDate: dayjs(workerDetails?.escapeDate).format("DD/MM/YYYY"),
      dateOfDismissalNotice: dayjs(workerDetails?.dateOfDismissalNotice).format(
        "DD/MM/YYYY"
      ),
      dismissalDate: dayjs(workerDetails?.dismissalDate).format("DD/MM/YYYY"),

      worker_passport: workerDetails?.authorityDetails?.passportNo || "",
      worker_id: workerDetails?.authorityDetails?.homeCountryGovtIdNumber || "",
      worker_dob: dayjs(workerDetails?.dateOfBirth).format("DD/MM/YYYY") || "",
      worker_phone: workerDetails?.israelPhoneNumber || "",
      current_date: dayjs().format("DD/MM/YYYY"),
      professionHebrew:
        workerDetails?.professionHebrew?.hebrewName ||
        workerDetails?.profession ||
        "",
      homeRelativeContactName: workerDetails?.homeRelativeContactName || "",
      homePhoneNumber: workerDetails?.homePhoneNumber || "",
      homeRelativeContactPhoneNumber:
        workerDetails?.homeRelativeContactPhoneNumber || "",
      homeRelativeContactRelation:
        workerDetails?.homeRelativeContactRelation || "",
      homeRelativeContactAddress:
        workerDetails?.homeRelativeContactAddress || "",
      homeCountryBankName:
        workerDetails?.paymentDetails?.homeCountryBankName || "",
      homeCountryBankCode:
        workerDetails?.paymentDetails?.homeCountryBankCode || "",
      homeCountryBranchNumber:
        workerDetails?.paymentDetails?.homeCountryBranchNumber || "",
      homeCountryBankAccountIBAN:
        workerDetails?.paymentDetails?.homeCountryBankAccountNumber || "",
      israelBankHebrewName:
        workerDetails?.paymentDetails?.israelBank?.hebrewName || "",
      israelBankBranch:
        workerDetails?.paymentDetails?.israelBranch?.hebrewName || "",
      israelBankAccountNumber:
        workerDetails?.paymentDetails?.israelBankAccountNumber || "",
      depositBankHebrewName:
        workerDetails?.paymentDetails?.depositBank?.hebrewName || "",
      depositBankBranch:
        workerDetails?.paymentDetails?.depositBranch?.hebrewName || "",
      depositBankAccountNumber:
        workerDetails?.paymentDetails?.depositBankAccountNumber || "",
      companyName: organizationSettings?.companyName || "",
      govId: organizationSettings?.govId || "",
      city: organizationSettings?.city || "",
      address: organizationSettings?.address || "",
      organizationNumber: organizationSettings?.organizationNumber || "",
      // New fields
      companyEnglishName: organizationSettings?.companyEnglishName || "",
      mainPhone: organizationSettings?.mainPhone || "",
      secPhone: organizationSettings?.secPhone || "",
      email: organizationSettings?.email || "",
      emailSenderName: organizationSettings?.emailSenderName || "",
      emailSenderAddress: organizationSettings?.emailSenderAddress || "",
      signaturePerson: organizationSettings?.signaturePerson || "",
      signaturePersonEnglish:
        organizationSettings?.signaturePersonEnglish || "",
      signaturePersonTitle: organizationSettings?.signaturePersonTitle || "",
      signaturePersonTitleEnglish:
        organizationSettings?.signaturePersonTitleEnglish || "",
      signaturePersonId: organizationSettings?.signaturePersonId || "",
      lawerName: organizationSettings?.lawerName || "",
      lawerNameEnglish: organizationSettings?.lawerNameEnglish || "",
      lawerGovId: organizationSettings?.lawerGovId || "",
      addressEnglish: organizationSettings?.addressEnglish || "",
      cityEnglish: organizationSettings?.cityEnglish || "",
      worker_country_hebrew: workerDetails?.country?.nameInHebrew || "",
      worker_country_english: workerDetails?.country?.nameInEnglish || "",
      worker_country_code: workerDetails?.country?.code || "",
    };

    const duplicatedInputs = {};
    // First add the base inputs as they are
    Object.keys(baseInputs).forEach((key) => {
      duplicatedInputs[key] = baseInputs[key];
    });

    // Then create numbered versions with a higher range
    Object.keys(baseInputs).forEach((key) => {
      // Create numbered versions without changing the original keys
      for (let i = 1; i <= 20; i++) {
        // Increased from 9 to 20 to support more pages
        duplicatedInputs[`${key}${i}`] = baseInputs[key];
      }
    });

    // Add signature data if available
    if (signatureData) {
      baseInputs.signature = signatureData;
      baseInputs.signature_image = signatureData;
      // Add numbered signature fields
      for (let i = 1; i <= 5; i++) {
        duplicatedInputs[`signature${i}`] = signatureData;
        duplicatedInputs[`signature_image${i}`] = signatureData;
      }
    }

    const result = [{ ...baseInputs, ...duplicatedInputs }];
    console.log("Generated inputs count:", Object.keys(result[0]).length);
    return result;
  }, [workerDetails, organizationSettings, signatureData]);

  const buildDesigner = useCallback(
    async (_template) => {
      if (!designerRef.current) return;
      try {
        const font = await getFontsData();
        const inputs = buildInputs();

        // First initialize with empty inputs
        designer.current = new Form({
          domContainer: designerRef.current,
          template: { ..._template },
          options: { font },
          inputs: [{}], // Start with empty inputs
          plugins: getPlugins(),
        });

        // Wait for template to be fully loaded then set inputs
        setTimeout(() => {
          if (designer.current) {
            console.log("Setting inputs after template load");
            designer.current.setInputs(inputs);
          }
        }, 500); // Give template time to fully load
      } catch (error) {
        console.error("Error in buildDesigner:", error);
      }
    },
    [buildInputs]
  );

  useEffect(() => {
    if (isDesignerReady && template) {
      buildDesigner(template);
    }
  }, [isDesignerReady, template, buildDesigner]);

  const loadRef = useCallback((r) => {
    if (r) {
      designerRef.current = r;
      setIsDesignerReady(true);
    }
  }, []);

  const handleQuickFill = useCallback(() => {
    if (designer.current) {
      const currentInputs = designer.current.getInputs()[0];
      console.log("QuickFill - Current Inputs:", currentInputs);
      console.log("QuickFill - Form Data:", formData);

      // Add signature data if available
      let updatedInputs = { ...currentInputs, ...formData };
      if (signature && !signature.isEmpty()) {
        // Get signature with proper size and quality
        const canvas = signature._canvas;
        const signatureData = canvas.toDataURL("image/png", 1.0);
        updatedInputs = {
          ...updatedInputs,
          signature_image: signatureData,
          signature_image1: signatureData,
          signature_image2: signatureData,
          signature_image3: signatureData,
          signature_image4: signatureData,
          signature_image5: signatureData,
        };
      }

      designer.current.setInputs([updatedInputs]);
      setOpenQuickFill(false);
      setActiveStep(0);
    }
  }, [formData, signature]);

  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(
    async (shouldNavigate = false) => {
      if (!designer.current) return;

      try {
        setIsSaving(true);

        // Get the current template and inputs
        const currentTemplate = designer.current.getTemplate();
        const currentInputs = designer.current.getInputs();

        if (!currentInputs || !currentInputs[0]) {
          throw new Error("No form data available");
        }

        // Get fields that are actually in the template
        const templateFields = new Set();
        if (currentTemplate?.schemas) {
          currentTemplate.schemas.forEach((schema) => {
            Object.keys(schema).forEach((key) => {
              templateFields.add(key);
            });
          });
        }

        // Filter inputs to only include fields present in template
        const filteredInputs = {};
        Object.entries(currentInputs[0]).forEach(([key, value]) => {
          if (templateFields.has(key)) {
            filteredInputs[key] = value;
          }
        });

        // Call onSubmit with the filtered data
        await onSubmit({
          template: currentTemplate,
          inputs: [filteredInputs],
          plugins: getPlugins(),
        });

        toast.success("הטופס נשמר בהצלחה", {
          position: "top-center",
        });

        // If shouldNavigate is true and we have nextDocId, navigate immediately
        if (shouldNavigate && nextDocId) {
          router.push(`/worker-documents/${slug}/sign/${nextDocId}`);
        }
      } catch (error) {
        console.error("Error saving form:", error);
        toast.error(error.message || "שגיאה בשמירת הטופס", {
          position: "top-center",
        });
      } finally {
        if (!shouldNavigate) {
          setIsSaving(false);
        }
      }
    },
    [onSubmit, nextDocId, slug, router]
  );

  const handleDialogClose = useCallback(() => {
    setOpenQuickFill(false);
    setActiveStep(0);
  }, []);

  const handleSignatureDialogClose = () => {
    setSignatureDialogOpen(false);
  };

  const handleSignatureSave = (signatureData) => {
    setSignatureData(signatureData);
    // Update the form with the new signature
    if (designer.current) {
      const currentInputs = designer.current.getInputs()[0];
      const updatedInputs = {
        ...currentInputs,
        signature: signatureData,
        signature_image: signatureData,
      };
      // Add numbered signature fields
      for (let i = 1; i <= 5; i++) {
        updatedInputs[`signature${i}`] = signatureData;
        updatedInputs[`signature_image${i}`] = signatureData;
      }
      designer.current.setInputs([updatedInputs]);
    }
    handleSignatureDialogClose();
  };

  // Add this function to handle signatures from the collector
  const handleSignaturesFromCollector = useCallback((signatures) => {
    if (designer.current) {
      const currentInputs = designer.current.getInputs()[0];
      const updatedInputs = {
        ...currentInputs,
        ...signatures,
      };
      designer.current.setInputs([updatedInputs]);
    }
  }, []);

  // Add animation keyframes at the top of the component
  const buttonAnimationKeyframes = `
    @keyframes pulseButton {
      0% {
        transform: scale(1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(33, 150, 243, 0.3);
      }
      100% {
        transform: scale(1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
    }
  `;

  // Add style tag for animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = buttonAnimationKeyframes;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [buttonAnimationKeyframes]);

  return (
    <Box
      className={styles.container}
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        bgcolor: "#f8f9fa",
      }}
    >
      {isSaving && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <CircularProgress size={40} sx={{ color: "#2196f3" }} />
          <Typography sx={{ mt: 2, color: "#1a237e", fontWeight: 500 }}>
            {nextDocId ? "מעביר למסמך הבא..." : "שמיר את הטופס..."}
          </Typography>
        </Box>
      )}

      <Box
        className={styles.viewer}
        sx={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          m: 2,
          mb: 10,
          bgcolor: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          "& > div": {
            position: "absolute !important",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            "& > div": {
              height: "100% !important",
            },
          },
        }}
      >
        <div
          ref={loadRef}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </Box>

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "20px 40px",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
          backgroundColor: "white",
          boxShadow: "0px -4px 20px rgba(0,0,0,0.08)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          zIndex: 1,
        }}
      >
        <Button
          onClick={() => handleSubmit(false)}
          disabled={isSaving}
          h={"52px"}
          minW={"280px"}
          bgc={"#2e7d32"}
          brs={"14px"}
          fsz={"1.1rem"}
          fw={600}
          customStyles={{
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#1b5e20",
              transform: "translateY(-2px)",
              boxShadow: "0 5px 15px rgba(46, 125, 50, 0.3)",
            },
            "&:disabled": {
              backgroundColor: "#81c784",
            },
            transition: "all 0.2s ease",
          }}
        >
          {isSaving ? (
            <>
              <CircularProgress size={24} sx={{ color: "white", mr: 1 }} />
              שומר...
            </>
          ) : (
            <>
              <SaveIcon style={{ marginRight: "8px" }} />
              שמירה{" "}
            </>
          )}
        </Button>

        {nextDocId && (
          <Button
            onClick={() => handleSubmit(true)}
            disabled={isSaving}
            h={"52px"}
            minW={"280px"}
            bgc={"#2e7d32"}
            brs={"14px"}
            fsz={"1.1rem"}
            fw={600}
            customStyles={{
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#1b5e20",
                transform: "translateY(-2px)",
                boxShadow: "0 5px 15px rgba(46, 125, 50, 0.3)",
              },
              "&:disabled": {
                backgroundColor: "#81c784",
              },
              transition: "all 0.2s ease",
            }}
          >
            {isSaving ? (
              <>
                <CircularProgress size={24} sx={{ color: "white", mr: 1 }} />
                שומר...
              </>
            ) : (
              <>
                <SaveIcon style={{ marginRight: "8px" }} />
                מור ועבור למסמך הבא
                <NavigateNextIcon style={{ marginLeft: "8px" }} />
              </>
            )}
          </Button>
        )}
      </Box>

      <SignatureDialog
        open={signatureDialogOpen}
        onClose={handleSignatureDialogClose}
        onSave={handleSignatureSave}
        translations={translations}
      />
      <Fab
        color="primary"
        aria-label="add signatures"
        sx={{
          position: "fixed",
          bottom: 100,
          right: 20,
          zIndex: 2,
          width: "auto",
          paddingLeft: 2,
          paddingRight: 2,
          borderRadius: "24px",
        }}
        onClick={() => setShowSignatureCollector(true)}
      >
        <CreateIcon sx={{ mr: 1 }} />
        {translations.quickSignature}
      </Fab>

      <SignatureCollectorModal
        open={showSignatureCollector}
        onClose={() => setShowSignatureCollector(false)}
        template={template}
        formData={formData}
        onSignaturesSave={handleSignaturesFromCollector}
        translations={translations}
      />
    </Box>
  );
};

PDFTemplateForm.displayName = "PDFTemplateForm";

export default PDFTemplateForm;
