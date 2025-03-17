import { ZOOM } from "@pdfme/common";
import SignaturePad from "signature_pad";
import { image } from "@pdfme/schemas";

const getEffectiveScale = (element) => {
  if (typeof window === "undefined") return 1;
  let scale = 1;
  while (element && element !== document.body) {
    const style = window.getComputedStyle(element);
    const transform = style.transform;
    if (transform && transform !== "none") {
      const localScale = parseFloat(
        transform.match(/matrix\((.+)\)/)?.[1].split(", ")[3] || "1"
      );
      scale *= localScale;
    }
    element = element.parentElement;
  }
  return scale;
};

// Extracts and properly prepares the base64 data from a data URL
// This is critical for the PDF rendering to work correctly
const extractImageData = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') {
    console.error("Invalid signature data: not a string or empty");
    return null;
  }
  
  try {
    // For data URLs, extract just the base64 data
    if (dataUrl.startsWith('data:image/')) {
      // Strip the prefix to get just the base64 data
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) {
        console.error("Failed to extract base64 data from data URL");
        return null;
      }
      return base64Data;
    }
    
    // If it's already base64 without the prefix
    if (/^[A-Za-z0-9+/=]+$/.test(dataUrl)) {
      return dataUrl;
    }
    
    console.error("Invalid signature data format - not a data URL or base64 string");
    return null;
  } catch (error) {
    console.error("Error extracting image data:", error);
    return null;
  }
};

// Create a custom PDF renderer function that properly handles signature data
const signaturePdfRenderer = (params) => {
  // Extract value and schema from params
  const value = params.value;
  const schema = params.schema;
  
  if (!value) {
    console.log("No signature value provided to renderer");
    return null;
  }
  
  console.log(`Processing signature in PDF renderer. Data length: ${value.length}`);
  
  // Extract the image data
  const imageData = extractImageData(value);
  if (!imageData) {
    console.error("Could not extract valid image data from signature");
    return null;
  }
  
  console.log("Successfully extracted signature image data for PDF");
  
  // Return a proper PDF image object
  return {
    image: imageData,
    fit: [schema.width, schema.height],
    alignment: 'center'
  };
};

export const signature = {
  ui: async (arg) => {
    const { schema, value, onChange, rootElement, mode, i18n } = arg;

    const canvas = document.createElement("canvas");
    canvas.width = schema.width * ZOOM;
    canvas.height = schema.height * ZOOM;

    if (typeof window !== "undefined") {
      const resetScale = 1 / getEffectiveScale(rootElement);
      const context = canvas.getContext("2d");
      context.scale(resetScale, resetScale);

      const signaturePad = new SignaturePad(canvas, {
        minWidth: 0.2,
        maxWidth: 1.5,
        penColor: "#00008B",
        throttle: 16,
        velocityFilterWeight: 0.7,
      });

      try {
        if (value) {
          signaturePad.fromDataURL(value, { ratio: resetScale });
        } else {
          signaturePad.clear();
        }
      } catch (e) {
        console.error("Error loading signature:", e);
        signaturePad.clear();
      }

      if (mode === "viewer") {
        signaturePad.off();
      } else {
        signaturePad.on();
        const clearButton = document.createElement("button");
        clearButton.style.position = "absolute";
        clearButton.style.zIndex = "1";
        clearButton.textContent = i18n("clear") || "x";
        clearButton.addEventListener("click", () => {
          onChange && onChange("");
          signaturePad.clear();
        });
        rootElement.appendChild(clearButton);
        signaturePad.addEventListener("endStroke", () => {
          const data = signaturePad.toDataURL("image/png");
          onChange && data && onChange(data);
        });
      }
      rootElement.appendChild(canvas);
    }
  },
  
  // This is the critical part - the PDF renderer for signature fields
  pdf: (params) => {
    console.log("signature.pdf renderer called with params:", params);
    
    // Ensure we have value and schema
    if (!params || !params.value) {
      console.warn("No value provided to signature renderer");
      return null;
    }
    
    // Extract the image data (get the base64 part without the data URL prefix)
    const imageData = extractImageData(params.value);
    if (!imageData) {
      console.error("Failed to extract image data from signature");
      return null;
    }
    
    console.log("Successfully extracted signature image data for PDF");
    
    // Return the image object configuration for the PDF renderer
    return {
      image: imageData,
      fit: [params.schema.width, params.schema.height],
      alignment: 'center'
    };
  },
  
  propPanel: {
    schema: {},
    defaultValue: "",
    defaultSchema: {
      type: "signature",
      position: { x: 0, y: 0 },
      width: 62.5,
      height: 37.5,
    },
  },
};
