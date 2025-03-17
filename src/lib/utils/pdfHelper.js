// Helper functions and imports for PDF handling
import { Template, checkTemplate } from "@pdfme/common";
import { Form, Viewer } from "@pdfme/ui";
import { generate } from "@pdfme/generator";
// Import only what's available in the schema package
import { text, image, barcodes, line, rectangle, ellipse } from "@pdfme/schemas";

// Font definitions
const fontObjList = [
  {
    fallback: true,
    label: "Rubik-Regular",
    url: "/fonts/Rubik-Regular.ttf",
  },
  {
    fallback: false,
    label: "RubikMedium",
    url: "/fonts/Rubik-Medium.ttf",
  },
  {
    fallback: false,
    label: "OpenSans-Regular",
    url: "/fonts/OpenSans-Regular.ttf",
  },
  {
    fallback: false,
    label: "Hebrew",
    url: "/fonts/OpenSansHebrew-Regular.ttf",
  },
  {
    fallback: false,
    label: "Arabic",
    url: "/fonts/NotoSansArabic-Regular.ttf",
  }
];

/**
 * Get fonts data for PDF generation
 */
export const getFontsData = async () => {
  try {
    // Create an object to hold font data
    const fonts = {};
    
    // Process each font in the list
    for (const fontObj of fontObjList) {
      try {
        // Fetch the font file
        const fontResponse = await fetch(fontObj.url);
        if (!fontResponse.ok) {
          console.warn(`Font ${fontObj.label} not found at ${fontObj.url}, skipping`);
          continue;
        }
        
        // Convert to array buffer
        const fontArrayBuffer = await fontResponse.arrayBuffer();
        
        // Add to fonts object
        fonts[fontObj.label] = fontArrayBuffer;
      } catch (error) {
        console.error(`Error loading font ${fontObj.label}:`, error);
      }
    }
    
    // If no fonts were loaded, return an empty object
    if (Object.keys(fonts).length === 0) {
      console.warn("No fonts were loaded, forms will use browser default fonts");
    }
    
    return fonts;
  } catch (error) {
    console.error("Error in getFontsData:", error);
    return {};
  }
};

/**
 * Get plugins for the PDF form
 */
export const getPlugins = () => {
  return {
    // Text field
    text: {
      ...text,
      label: "Text Field",
    },
    // Read-only text
    readonly: {
      type: "text",
      label: "Read-only Text",
      readOnly: true,
      fontSize: 12,
      fontColor: "#000000",
    },
    // Signature field
    signature: {
      type: "text",
      label: "Signature Field",
      defaultValue: "",
      className: "signature",
      fontSize: 12,
      fontColor: "#000000",
      placeholder: "Click to sign",
      fontFamily: "Rubik-Regular",
    },
    // Date field
    date: {
      type: "text",
      label: "Date Field",
      defaultValue: (new Date()).toLocaleDateString(),
      className: "date-field",
      fontSize: 12,
      fontColor: "#000000",
      fontFamily: "Rubik-Regular",
    },
    // Image field
    image: {
      ...image,
      label: "Image",
    },
    // Read-only image
    readOnlyImage: {
      ...image,
      label: "Read-only Image",
      readOnly: true,
    },
    // Line
    line: {
      ...line,
      label: "Line",
    },
    // Rectangle
    rectangle: {
      ...rectangle,
      label: "Rectangle",
    },
    // Ellipse
    ellipse: {
      ...ellipse,
      label: "Ellipse",
    },
    // Barcode
    barcode: {
      ...barcodes.qrcode,
      label: "QR Code",
    }
  };
};

/**
 * Get a default schema for PDF template
 */
export const getDefaultSchema = () => {
  return {
    basePdf: "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G",
    schemas: [
      {
        pages: [
          {
            width: 595,
            height: 842,
            elements: []
          }
        ]
      }
    ],
    id: "default-template",
    name: "Default Template"
  };
};

/**
 * Convert base64 string to Blob
 */
export const base64toBlob = (base64, type = 'application/pdf') => {
  const binaryString = window.atob(base64.split(',')[1]);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type });
};

/**
 * Read a file as ArrayBuffer
 */
export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Read a file as DataURL
 */
export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Clone an object deeply
 */
export const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Check if a string is valid JSON
 */
export const isJsonString = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Generate PDF from template and inputs
 */
export const generatePDF = async (template, inputs, options = {}) => {
  try {
    // Get fonts data
    const fonts = await getFontsData();
    
    // Generate PDF
    const pdfArrayBuffer = await generate({
      template,
      inputs: inputs || [{}],
      options: {
        font: fonts,
        plugins: getPlugins(),
        ...options
      }
    });
    
    return new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}; 