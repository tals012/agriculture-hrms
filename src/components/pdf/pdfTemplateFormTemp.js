"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { getFontsData, getPlugins } from "@/components/pdf/helper";
import { Form } from "@pdfme/ui";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import SignaturePad from "signature_pad";
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
  Button,
  Paper,
  Avatar,
  AppBar,
  Toolbar,
  LinearProgress,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SaveIcon from "@mui/icons-material/Save";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CreateIcon from "@mui/icons-material/Create";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  getLanguageFromCountryCode,
  languageTranslations,
} from "@/lib/utils/languageMappings";
import styles from "@/styles/components/pdfEditor.module.scss";

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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
          maxWidth: '450px',
          margin: '0 auto',
          dir: translations.langDir || 'rtl', // Support RTL for Hebrew
        }
      }}
    >
      <DialogTitle 
          sx={{
          borderBottom: '1px solid #e5e7eb', 
          padding: '12px 16px',
          bgcolor: '#f9fafb'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            {translations.signature || 'חתימה'}
          </Typography>
          <IconButton 
            edge="end" 
            onClick={onClose} 
            aria-label="close"
            tabIndex={0}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ padding: '16px', bgcolor: '#fff' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
            {translations.selectSignatureField || 'בחר שדה חתימה'}
          </Typography>
          <Box sx={{ 
            border: '2px dashed #d1d5db', 
            borderRadius: 1, 
            backgroundColor: '#f9fafb',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
            width: '100%',
            height: 180,
            minHeight: 150,
            '&:hover': {
              borderColor: '#9ca3af'
            }
          }}>
            <canvas
              ref={canvasRef}
              style={{ 
                width: '100%', 
                height: '100%', 
                touchAction: 'none', 
                cursor: 'crosshair'
              }}
              tabIndex={0}
              aria-label={translations.signatureCanvas || 'שטח חתימה'}
            />
          </Box>
          <Box sx={{ 
            display: "flex", 
            gap: 2, 
            justifyContent: "flex-end",
            mt: 1
          }}>
            <Button 
              variant="outlined" 
              color="inherit"
              onClick={handleClear}
              startIcon={<CloseIcon />}
              tabIndex={0}
              sx={{ 
                backgroundColor: '#f3f4f6', 
                color: '#4b5563',
                border: 'none',
                padding: '8px 12px',
                '&:hover': {
                  backgroundColor: '#e5e7eb',
                  border: 'none'
                }
              }}
            >
              {translations.clearSignature || 'נקה חתימה'}
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSave}
              tabIndex={0}
              disabled={!signaturePadRef.current || signaturePadRef.current.isEmpty()}
              sx={{ 
                backgroundColor: '#2563eb',
                padding: '8px 12px',
                '&:hover': {
                  backgroundColor: '#1d4ed8'
                }
              }}
            >
              {translations.saveAndNext || 'שמור והמשך'}
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

    console.log(template?.schemas, "template?.schemas");	

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

        // Check if it's explicitly marked as a signature field in the schema
        const schemaField = template?.schemas?.[0]?.[title];
        const isSignatureInSchema =
          schemaField?.type === "signature" ||
          schemaField?.type === "signature_image" ||
          title.toLowerCase().includes("signature") ||
          title.toLowerCase().includes("field") || // Added to catch field1, field2, etc.
          title.toLowerCase().includes("חתימה");

        // Check for the specific signature field structure - more permissive now
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

        // SIMPLIFIED DETECTION: prioritize schema information and be more permissive with DOM structure
        // This improves detection reliability while reducing false negatives
        const isSignatureField =
          (isSignatureInSchema && isSelectable && hasSignatureDimensions) || // Schema-based detection
          (isSelectable && hasCanvas && hasSignatureDimensions && // Canvas-based detection
            (hasXButton || hasSignatureCanvasStyles));

        // Only log when we find a potential signature field
        if (isSignatureField || isSignatureInSchema) {
          console.log("Found potential signature field:", {
          title,
          hasCanvas,
          hasXButton,
          hasSignatureCanvasStyles,
          hasContentEditable,
          dimensions: { width: rect.width, height: rect.height },
          isSignatureInSchema,
          isSignatureField,
          isSelectable,
            elementHtml: element.outerHTML.slice(0, 60) + "..."
        });
        }

        return isSignatureField;
      };

      const pollForFields = async () => {
        if (!mounted || pollCount >= maxPolls) {
          console.log("Polling stopped:", { pollCount, maxPolls, mounted });
          return;
        }

        pollCount++;
        // Only log every 5th attempt to reduce console spam
        if (pollCount % 5 === 0 || pollCount === 1) {
        console.log(`Polling attempt ${pollCount}`);
        }

        // Get all paper containers and the PDF container
        const paperElements = Array.from(
          document.querySelectorAll('[id^="@pdfme/ui-paper"]')
        );
        const pdfContainer = document.querySelector(`.${styles.viewer}`);

        // Calculate expected number of pages from schema
        const expectedPages = template?.basePdf?.pages || 1;

        // Only log every 5th attempt to reduce console spam
        if (pollCount % 5 === 0 || pollCount === 1) {
        console.log("Found elements:", {
          paperElements: paperElements.length,
          expectedPages,
          containerFound: !!pdfContainer,
        });
        }

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
          
          // PRE-SCAN: Check schema for signature fields
          // This improves detection by using schema information even if DOM elements aren't fully ready
          try {
            Object.entries(template.schemas[0] || {}).forEach(([key, value]) => {
              if (
                (value.type === "signature" || value.type === "signature_image") &&
                !foundFields.has(key)
              ) {
                console.log("Found signature field in schema:", key);
                
                // If we have position data in the schema, we can use it
                if (value.position) {
                  const pageNum = Math.floor(value.position.y / 841.89) + 1; // Standard PDF page height
                  
                  foundFields.add(key);
                  foundNewField = true;
                  fields.push({
                    key,
                    type: "signature",
                    position: value.position,
                    width: value.width || 200, // Default width if not specified
                    height: value.height || 60, // Default height if not specified
                    page: pageNum,
                    foundInSchema: true,
                    label: `${key
                      .replace(/_/g, " ")
                      .replace(/([A-Z])/g, " $1")
                      .trim()} (Page ${pageNum})`,
                  });
                }
              }
            });
          } catch (error) {
            console.error("Error during schema field detection:", error);
          }

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
              const waitTime = Math.min(100 + index * 50, 500); // Increases with each page, max 500ms
              await new Promise((resolve) => setTimeout(resolve, waitTime));

              // Get selectable elements for this page
              const selectableElements = Array.from(
                paperElement.querySelectorAll(".selectable")
              );
              
              if (pollCount % 5 === 0 || pollCount === 1) {
              console.log(
                `Checking page ${paperElement.id} (${index + 1}/${
                  paperElements.length
                }), found ${selectableElements.length} selectable elements`
              );
              }

              // Process selectable elements
              for (const element of selectableElements) {
                const title = element.getAttribute("title");
                if (!title || foundFields.has(title)) continue;

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
        // Reset polling state
        pollCount = 0;
        foundFields.clear();

        // Only start the polling with the initial delay
      const initialDelay = setTimeout(() => {
          console.log("Initial delay complete, beginning signature field detection...");
          
          // IMPROVEMENT: Try to identify signature fields in schema first before DOM polling starts
          try {
            const schemaFields = [];
            
            Object.entries(template.schemas[0] || {}).forEach(([key, value]) => {
              if (value.type === "signature" || value.type === "signature_image") {
                const pageNum = value.position ? Math.floor(value.position.y / 841.89) + 1 : 1;
                schemaFields.push({
                  key,
                  type: "signature",
                  position: value.position || { x: 0, y: 0 },
                  width: value.width || 200,
                  height: value.height || 60,
                  page: pageNum,
                  foundInSchema: true,
                  label: `${key
                    .replace(/_/g, " ")
                    .replace(/([A-Z])/g, " $1")
                    .trim()} (Page ${pageNum})`,
                });
                foundFields.add(key);
              }
            });
            
            if (schemaFields.length > 0) {
              console.log("Pre-loading schema-defined signature fields:", schemaFields);
              setDynamicSignatureFields((prev) => {
                const newFields = [...prev];
                schemaFields.forEach((field) => {
                  if (!newFields.some((f) => f.key === field.key)) {
                    newFields.push(field);
                  }
                });
                return newFields;
              });
            }
          } catch (error) {
            console.error("Error pre-loading schema fields:", error);
          }
          
          // Start the actual polling
        pollForFields().catch(console.error);
      }, 1000);
        
        return initialDelay;
      };

      // Start polling with initial delay to allow for rendering
      const initialDelay = startPolling();

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
    const handleFieldSelect = (fieldKey) => {
      setActiveSignatureField(fieldKey);
      
      // Clear the canvas when switching fields
      if (signaturePadRef.current) {
        signaturePadRef.current.clear();
        setHasCurrentSignature(false);
      }
    };
    
    // Alias for consistency with the updated renderSignatureButton
    const handleSignatureFieldClick = handleFieldSelect;

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

          // Convert to PNG with transparency - use high quality
          const signatureData = signatureCanvas.toDataURL("image/png", 1.0);
          
          // Create a clean version of the signature to ensure proper PDF rendering
          const cleanSignatureImg = new Image();
          cleanSignatureImg.onload = () => {
            const cleanCanvas = document.createElement('canvas');
            cleanCanvas.width = cleanSignatureImg.width;
            cleanCanvas.height = cleanSignatureImg.height;
            
            const cleanCtx = cleanCanvas.getContext('2d');
            cleanCtx.clearRect(0, 0, cleanCanvas.width, cleanCanvas.height);
            cleanCtx.drawImage(cleanSignatureImg, 0, 0);
            
            // Get the final clean signature data
            const cleanSignatureData = cleanCanvas.toDataURL('image/png', 1.0);

          const newSignatures = {
            ...signatures,
              [activeSignatureField]: cleanSignatureData,
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
          };
          
          // Set the source to trigger loading and processing
          cleanSignatureImg.src = signatureData;
          
          // Error handling
          cleanSignatureImg.onerror = () => {
            console.error("Failed to process signature image");
            toast.error("Failed to process signature. Please try again.", {
              position: "top-center",
            });
          };
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

          // Convert to PNG with transparency - use high quality
          const signatureData = signatureCanvas.toDataURL("image/png", 1.0);
          console.log("Generated signature data with length:", signatureData.length);
          
          // Create a clean version of the signature to ensure proper PDF rendering
          const cleanSignatureImg = new Image();
          cleanSignatureImg.onload = () => {
            // Create a clean canvas to redraw the signature
            // This step is crucial for proper PDF rendering
            const cleanCanvas = document.createElement('canvas');
            cleanCanvas.width = cleanSignatureImg.width;
            cleanCanvas.height = cleanSignatureImg.height;
            
            const cleanCtx = cleanCanvas.getContext('2d');
            cleanCtx.clearRect(0, 0, cleanCanvas.width, cleanCanvas.height);
            cleanCtx.drawImage(cleanSignatureImg, 0, 0);
            
            // Get the final clean signature data with highest quality
            const cleanSignatureData = cleanCanvas.toDataURL('image/png', 1.0);
            console.log("Cleaned signature data for all fields with length:", cleanSignatureData.length);

          // Apply the signature to all unsigned fields across all pages
          const newSignatures = { ...signatures };
          allSignatureFields.forEach((field) => {
            if (!newSignatures[field.key]) {
                newSignatures[field.key] = cleanSignatureData;
            }
          });

          setSignatures(newSignatures);
          signaturePadRef.current.clear();
          setHasCurrentSignature(false);

          // Save and close since all fields are now signed
          onSignaturesSave(newSignatures);
          onClose();
          };
          
          // Set the source to trigger loading and processing
          cleanSignatureImg.src = signatureData;
          
          // Error handling
          cleanSignatureImg.onerror = (error) => {
            console.error("Failed to process signature image:", error);
            toast.error("Failed to process signature. Please try again.", {
              position: "top-center",
            });
          };
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
      const isSigned = !!signatures[field.key];
      const isActive = activeSignatureField === field.key;

      return (
        <Paper
          key={field.key}
          onClick={() => handleSignatureFieldClick(field.key)}
          elevation={isActive || isSigned ? 1 : 0}
            sx={{
            mb: 1,
            p: 1.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
              gap: 1.5,
            borderRadius: 1,
            border: '1px solid',
            borderColor: isSigned ? '#059669' : isActive ? '#2563eb' : '#e5e7eb',
            backgroundColor: isSigned ? '#ecfdf5' : isActive ? '#eff6ff' : 'white',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              borderColor: isSigned ? '#059669' : isActive ? '#2563eb' : '#d1d5db',
            }
          }}
        >
          <Avatar
                sx={{
              width: 40,
              height: 40,
              bgcolor: isSigned ? '#ecfdf5' : '#f3f4f6',
              color: isSigned ? '#059669' : '#6b7280'
            }}
          >
            {isSigned ? (
              <CheckCircleIcon color="success" />
            ) : (
              <CreateIcon />
            )}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
              {field.label || `${translations.signature} ${index + 1}`}
                </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              {translations.page} {field.page}
                  </Typography>
              </Box>
        </Paper>
      );
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            maxHeight: '80vh',
            height: 'auto',
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            dir: translations.langDir || 'rtl', // Support RTL for Hebrew
            maxWidth: '900px',
            margin: '0 auto'
          }
        }}
      >
        {/* Header with Material UI AppBar */}
        <AppBar position="static" color="primary" sx={{ 
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Toolbar sx={{ px: 2, py: 0.75, minHeight: '48px' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, fontSize: '1.1rem' }}>
              {translations.signaturesCompleted || 'חתימות שהושלמו'} ({Object.keys(signatures).length}/{allSignatureFields.length})
            </Typography>
            <IconButton 
              edge="end" 
              color="inherit" 
              onClick={onClose} 
              aria-label="close"
              tabIndex={0}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
          {isMobile && (
            <LinearProgress 
              variant="determinate" 
              value={(Object.keys(signatures).length / Math.max(1, allSignatureFields.length)) * 100}
                sx={{
                height: 4, 
                backgroundColor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#ffffff'
                }
              }}
            />
          )}
        </AppBar>

        {/* Main content area */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexGrow: 1,
          overflow: 'hidden',
          height: 'calc(100% - 100px)', // Smaller height adjustment
          '@media (max-width: 768px)': {
            flexDirection: 'column'
          }
        }}>
          {allSignatureFields.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                p: 3,
                textAlign: "center",
                bgcolor: 'white'
              }}
            >
              <CreateIcon
                sx={{ fontSize: 50, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" sx={{ color: "text.primary", mb: 1 }}>
                {translations.noSignaturesFound || 'לא נמצאו שדות חתימה'}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {translations.noSignaturesDescription || 'לא נמצאו שדות חתימה במסמך זה'}
              </Typography>
            </Box>
          ) : (
            <>
              {/* Canvas Section - Always visible */}
              <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                p: 2,
                bgcolor: 'white',
                overflow: 'hidden',
                height: '100%'
              }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1.5,
                    fontWeight: 600,
                    color: '#111827',
                    fontSize: '1rem'
                  }}
                >
                  {activeSignatureField
                    ? `${translations.signature || 'חתימה'} ${
                        allSignatureFields.findIndex(
                          (field) => field.key === activeSignatureField
                        ) + 1
                      }`
                    : translations.selectSignatureField || 'בחר שדה חתימה'}
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    border: '2px dashed #d1d5db',
                    borderRadius: 2,
                    backgroundColor: '#f9fafb',
                    mb: 1.5,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      borderColor: '#9ca3af'
                    }
                  }}
                >
                  {!activeSignatureField ? (
                    <Typography color="text.secondary" sx={{
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <CreateIcon fontSize="small" />
                      {translations.selectFieldToSign || 'נא לבחור שדה כדי לחתום'}
                    </Typography>
                  ) : (
                  <canvas
                    ref={canvasRef}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        touchAction: 'none', 
                        cursor: 'crosshair'
                      }}
                      tabIndex={0}
                      aria-label={translations.signatureCanvas || 'שטח חתימה'}
                    />
                  )}
                </Paper>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    onClick={handleClear}
                    disabled={!activeSignatureField || !hasCurrentSignature}
                    variant="outlined"
                    color="inherit"
                    tabIndex={0}
                    startIcon={<CloseIcon />}
                    size="small"
                    sx={{ 
                      backgroundColor: '#f3f4f6', 
                      color: '#4b5563',
                      border: 'none',
                      padding: '6px 12px',
                      '&:hover': {
                        backgroundColor: '#e5e7eb',
                        border: 'none'
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5
                      }
                    }}
                  >
                    {translations.clearSignature || 'נקה חתימה'}
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    onClick={handleSignAll}
                    disabled={!activeSignatureField || !hasCurrentSignature}
                    variant="contained"
                    color="success"
                    tabIndex={0}
                    size="small"
                    sx={{
                      backgroundColor: '#059669',
                      padding: '6px 12px',
                      '&:hover': {
                        backgroundColor: '#047857'
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5
                      }
                    }}
                  >
                    {translations.signAllFields || 'חתום על כל השדות'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!activeSignatureField || !hasCurrentSignature}
                    variant="contained"
                    color="primary"
                    tabIndex={0}
                    size="small"
                    className={hasCurrentSignature ? styles.pulse : ""}
                    sx={{
                      backgroundColor: '#2563eb',
                      padding: '6px 12px',
                      '&:hover': {
                        backgroundColor: '#1d4ed8'
                      },
                      '&.Mui-disabled': {
                        opacity: 0.5
                      }
                    }}
                  >
                    {Object.keys(signatures).length === allSignatureFields.length - 1 && hasCurrentSignature
                      ? (translations.signAndFinish || 'חתום וסיים')
                      : (translations.saveAndNext || 'שמור והמשך')}
                  </Button>
                </Box>
              </Box>

              {/* Signature Fields List - Hidden on mobile when signing */}
              {(!isMobile || !activeSignatureField) && (
                <Box sx={{
                  width: 280,
                  bgcolor: '#f9fafb',
                  borderLeft: '1px solid #e5e7eb',
                  overflow: 'auto',
                  height: '100%',
                  '@media (max-width: 768px)': {
                    width: '100%',
                    borderLeft: 'none',
                    borderTop: '1px solid #e5e7eb',
                    maxHeight: 250
                  }
                }}>
                  {Object.entries(signatureFieldsByPage).map(
                    ([page, fields]) => (
                      <Box key={page} sx={{ p: 1.5 }}>
                        <Paper
                          elevation={0}
                          sx={{
                            mb: 1.5,
                            px: 1.5,
                            py: 0.75,
                            fontWeight: 600,
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                            bgcolor: "background.paper",
                            borderRadius: 1,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Typography variant="subtitle2" sx={{fontWeight: 600, fontSize: '0.8rem'}}>
                            {translations.page || 'עמוד'} {page}
                          </Typography>
                          <Chip 
                            size="small"
                            label={`${fields.filter((f) => signatures[f.key]).length}/${fields.length}`}
                            color="primary"
                            sx={{height: 20, fontWeight: 500, fontSize: '0.7rem'}}
                          />
                        </Paper>

                        {fields.map((field, index) => renderSignatureButton(field, index))}
                      </Box>
                    )
                  )}
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Footer with Material UI styled footer */}
        <Box sx={{ 
          borderTop: '1px solid #e5e7eb',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f9fafb'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ 
                fontWeight: 600, 
                color: 'primary.main',
                fontSize: '1.1rem',
                mr: 1
              }}>
              {Object.keys(signatures).length}
              </Box>
              {translations.outOf || 'מתוך'} {allSignatureFields.length} {translations.signaturesCompleted || 'חתימות הושלמו'}
            </Typography>
          </Box>
          <Button
            onClick={handleComplete}
            disabled={Object.keys(signatures).length === 0}
            variant="contained" 
            color="success"
            tabIndex={0}
            size="medium"
            endIcon={<CheckCircleIcon />}
            sx={{
              backgroundColor: '#059669',
              fontWeight: 600,
              px: 2,
              py: 0.75,
              '&:hover': {
                backgroundColor: '#047857'
              },
              '&.Mui-disabled': {
                opacity: 0.5
              }
            }}
          >
            {translations.signAndFinishClose || 'חתום וסיים'}
          </Button>
        </Box>
      </Dialog>
    );
  }
);

SignatureCollectorModal.displayName = "SignatureCollectorModal";

const PdfTemplateFormTemp = ({
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


  console.log("///////////////// PdfTemplateFormTemp - template \\\\\\\\\\\\\\\\\\\n", template);

  // Get language code and translations based on country code
  const languageCode = getLanguageFromCountryCode(countryCode);
  const translations =
    languageTranslations[languageCode] || languageTranslations.en;

  // console.log("PdfTemplateFormTemp - countryCode:", countryCode);
  // console.log("PdfTemplateFormTemp - languageCode:", languageCode);
  // console.log("PdfTemplateFormTemp - translations:", translations);

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
          // Check if this is a signature field by content or name
          const isSignatureField = 
            (typeof value === 'string' && value.startsWith('data:image/')) || 
            key.toLowerCase().includes('signature') || 
            key.toLowerCase() === 'sign' ||
            key.toLowerCase().includes('_sign');

          // Always include signature fields, otherwise check if it's in template
          if (isSignatureField || templateFields.has(key)) {
            filteredInputs[key] = value;
            
            // If this is a signature field but not in template, make sure we add it to schema
            if (isSignatureField && !templateFields.has(key) && currentTemplate?.schemas?.[0]) {
              console.log(`Adding missing signature field "${key}" to schema`);
              currentTemplate.schemas[0][key] = {
                type: "signature",
                position: { x: 0, y: 0 },
                width: 170,
                height: 40,
                rotate: 0,
                opacity: 1
              };
            }
          }
        });

        console.log("Submitting with inputs:", filteredInputs);
        console.log("Signature fields identified:", 
          Object.entries(filteredInputs)
            .filter(([k, v]) => typeof v === 'string' && v.startsWith('data:image/'))
            .map(([k]) => k)
        );

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
    // Check if signatureData is a data URL and process it properly
    if (!signatureData || !signatureData.startsWith('data:image/')) {
      console.error("Invalid signature data format");
      return;
    }
    
    try {
      // Clean up the signature data to ensure it's a valid image
      const img = new Image();
      img.onload = () => {
        // Image loaded successfully, create a clean version that works in PDFs
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Get a clean version of the signature data
        // This needs to be a proper PNG format with transparency
        // Use quality 1.0 to avoid compression artifacts that can cause rendering issues
        const cleanSignatureData = canvas.toDataURL('image/png', 1.0);
        console.log("Cleaned signature data created with length:", cleanSignatureData.length); // Debug log
        
        // Set the signature data in the state
        setSignatureData(cleanSignatureData);
        
    // Update the form with the new signature
    if (designer.current) {
          const currentInputs = designer.current.getInputs()[0] || {};
          
          // Create a new inputs object to avoid reference issues
          const updatedInputs = { ...currentInputs };
          
          // Add signature to standard fields
          updatedInputs.signature = cleanSignatureData;
          updatedInputs.signature_image = cleanSignatureData;
          
          console.log("Setting signature fields"); // Debug log
          
      // Add numbered signature fields
      for (let i = 1; i <= 5; i++) {
            updatedInputs[`signature${i}`] = cleanSignatureData;
            updatedInputs[`signature_image${i}`] = cleanSignatureData;
      }
          
          console.log("Setting form inputs with signatures"); // Debug log
          
          // Use setInputs instead of updateInputs for consistency
      designer.current.setInputs([updatedInputs]);
          
          // Close the dialog
    handleSignatureDialogClose();
        }
      };
      
      img.onerror = () => {
        console.error("Failed to load signature image data");
        toast.error("Failed to process signature. Please try again.", {
          position: "top-center",
        });
      };
      
      // Set the src to trigger loading
      img.src = signatureData;
    } catch (error) {
      console.error("Error processing signature:", error);
      toast.error("An error occurred while processing the signature", {
        position: "top-center",
      });
    }
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
        <button
          onClick={() => handleSubmit(false)}
          disabled={isSaving}
          // h={"52px"}
          // minW={"280px"}
          // bgc={"#2e7d32"}
          // brs={"14px"}
          // fsz={"1.1rem"}
          // fw={600}
          // customStyles={{
          //   textTransform: "none",
          //   "&:hover": {
          //     backgroundColor: "#1b5e20",
          //     transform: "translateY(-2px)",
          //     boxShadow: "0 5px 15px rgba(46, 125, 50, 0.3)",
          //   },
          //   "&:disabled": {
          //     backgroundColor: "#81c784",
          //   },
          //   transition: "all 0.2s ease",
          // }}
          className={styles.button}
        >
          {isSaving ? (
            <>
              <CircularProgress size={24} sx={{ color: "white", mr: 1 }} />
              שומר...
            </>
          ) : (
            <>
              <SaveIcon />
              שמירה{" "}
            </>
          )}
        </button>

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


export default PdfTemplateFormTemp;
