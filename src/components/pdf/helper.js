// Helper functions and imports
import { Template, Font, checkTemplate } from "@pdfme/common";
import { Form, Viewer, Designer } from "@pdfme/ui";
import { generate } from "@pdfme/generator";
import {
  text,
  readOnlyText,
  barcodes,
  image,
  readOnlyImage,
  svg,
  readOnlySvg,
  line,
  rectangle,
  ellipse,
} from "@pdfme/schemas";

import plugins from "./plugins";

// TODO: Add relevant fonts here
const fontObjList = [
  {
    fallback: true,
    label: "Rubik-Regular",
    url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/fonts/Rubik-Regular.ttf`,
  },
  {
    fallback: false,
    label: "NotoSerifJP-Regular",
    url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/fonts/Rubik-Regular.ttf`,
  },
  {
    fallback: false,
    label: "NotoSansJP-Regular",
    url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/fonts/Rubik-Regular.ttf`,
  },
];

export const getFontsData = async () => {
  const fontDataList = await Promise.all(
    fontObjList.map(async (font) => ({
      ...font,
      data: await fetch(font.url).then((res) => res.arrayBuffer()),
    }))
  );

  return fontDataList.reduce(
    (acc, font) => ({ ...acc, [font.label]: font }),
    {}
  );
};

export const readFile = (file, type) => {
  return new Promise((r) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", (e) => {
      if (e && e.target && e.target.result && file !== null) {
        r(e.target.result);
      }
    });
    if (file !== null) {
      if (type === "text") {
        fileReader.readAsText(file);
      } else if (type === "dataURL") {
        fileReader.readAsDataURL(file);
      } else if (type === "arrayBuffer") {
        fileReader.readAsArrayBuffer(file);
      }
    }
  });
};

export const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj));

const getTemplateFromJsonFile = (file) => {
  return readFile(file, "text").then((jsonStr) => {
    const template = JSON.parse(jsonStr);
    try {
      checkTemplate(template);
      return template;
    } catch (e) {
      throw e;
    }
  });
};

export const downloadJsonFile = (json, title) => {
  if (typeof window !== "undefined") {
    const blob = new Blob([JSON.stringify(json)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

export const handleLoadTemplate = (e, currentRef) => {
  if (e.target && e.target.files) {
    getTemplateFromJsonFile(e.target.files[0])
      .then((t) => {
        if (!currentRef) return;
        currentRef.updateTemplate(t);
      })
      .catch((e) => {
        alert(`Invalid template file.
--------------------------
${e}`);
      });
  }
};

export const getPlugins = () => {
  // Detailed check for signature plugin
  if (plugins && plugins.signature) {
    console.log("Custom signature plugin found and loaded");
  } else {
    console.warn("No custom signature plugin found, signature fields may not render correctly");
  }

  // Add additional fallback renderer if needed
  if (!plugins.signature || !plugins.signature.pdf) {
    console.warn("Creating fallback signature PDF renderer");
    
    // If the signature plugin doesn't exist or doesn't have a PDF renderer,
    // add a basic one that can handle signature images
    if (!plugins.signature) {
      plugins.signature = {};
    }
    
    // Create a fallback PDF renderer for signatures
    plugins.signature.pdf = (params) => {
      if (!params || !params.value) {
        return null;
      }
      
      // For signature data URLs, extract just the base64 part
      let imageData = params.value;
      if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
        imageData = imageData.split(',')[1];
      }
      
      if (!imageData) {
        return null;
      }
      
      // Return PDF image object
      return {
        image: imageData,
        fit: [params.schema?.width || 170, params.schema?.height || 40],
        alignment: 'center'
      };
    };
  }

  // Create a special text renderer that can detect and handle signature data
  const specialTextRenderer = (params) => {
    // Check if this looks like a signature (data URL in a text field)
    if (params && params.value && 
        typeof params.value === 'string' && 
        params.value.startsWith('data:image/')) {
      
      console.log(`Text field contains signature data, using image renderer instead of text`);
      
      try {
        // Extract the base64 data
        const base64Data = params.value.split(',')[1];
        if (!base64Data) {
          console.error("Failed to extract base64 data from signature in text field");
          return text.pdf(params); // Fall back to regular text rendering
        }
        
        // Return as an image object for PDF rendering
        return {
          image: base64Data,
          fit: [params.schema.width || 170, params.schema.height || 40],
          alignment: 'center'
        };
      } catch (error) {
        console.error("Error handling signature data in text field:", error);
        return text.pdf(params); // Fall back to regular text rendering
      }
    }
    
    // For regular text, use the default text renderer
    return text.pdf(params);
  };

  // Create our custom text type with the special renderer
  const customText = {
    ...text,
    pdf: specialTextRenderer
  };

  const pluginsToUse = {
    // Use our special text renderer that can handle signatures
    Text: customText,
    ReadOnlyText: readOnlyText,
    Line: line,
    Rectangle: rectangle,
    Ellipse: ellipse,
    Image: image,
    ReadOnlyImage: readOnlyImage,
    SVG: svg,
    ReadOnlySvg: readOnlySvg,
    QR: barcodes.qrcode,
    Code128: barcodes.code128,
    // Use our signature plugin if available
    signature: plugins?.signature || null,
    Checkbox: plugins?.checkbox || null,
  };
  
  console.log("Configured plugins:", Object.keys(pluginsToUse));
  return pluginsToUse;
};

export const generatePDF = async (currentRef) => {
  if (!currentRef) return;

  const template = currentRef.getTemplate();
  const inputs =
    typeof currentRef.getInputs === "function"
      ? currentRef.getInputs()
      : template.sampledata ?? [];

  const fonts = await getFontsData();

  const pdf = await generate({
    template,
    inputs,
    options: {
      title: "pdfme",
    },
    fonts, // Ensure fonts is passed correctly
    plugins: getPlugins(),
  });

  const blob = new Blob([pdf.buffer], { type: "application/pdf" });
  window.open(URL.createObjectURL(blob));
};

export const isJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export const getTemplate = () => ({
  schemas: [
    {
      name: {
        type: "text",
        position: {
          x: 25.06,
          y: 24.35,
        },
        width: 77.77,
        height: 18.7,
        rotate: 0,
        opacity: 1,
        fontSize: 36,
        fontColor: "#14b351",
        fontName: "NotoSerifJP-Regular",
      },
      photo: {
        type: "image",
        position: {
          x: 24.99,
          y: 65.61,
        },
        width: 60.66,
        height: 93.78,
        rotate: 0,
        opacity: 1,
      },
      age: {
        type: "text",
        position: {
          x: 35.5,
          y: 178.46,
        },
        width: 43.38,
        height: 6.12,
        rotate: 0,
        opacity: 1,
        fontSize: 12,
        fontName: "NotoSerifJP-Regular",
      },
      sex: {
        type: "text",
        position: {
          x: 35,
          y: 185.23,
        },
        width: 43.38,
        height: 6.12,
        rotate: 0,
        opacity: 1,
        fontSize: 12,
        fontName: "NotoSerifJP-Regular",
      },
      weight: {
        type: "text",
        position: {
          x: 41.05,
          y: 192.26,
        },
        width: 43.38,
        height: 6.12,
        rotate: 0,
        opacity: 1,
        fontSize: 12,
        fontColor: "#14b351",
        fontName: "Rubik-Regular",
      },
      breed: {
        type: "text",
        position: {
          x: 39,
          y: 199.09,
        },
        width: 43.38,
        height: 6.12,
        rotate: 0,
        opacity: 1,
        fontSize: 12,
        fontColor: "#14b351",
        fontName: "Rubik-Regular",
      },
      owner: {
        type: "qrcode",
        position: {
          x: 115.09,
          y: 204.43,
        },
        width: 26.53,
        height: 26.53,
        rotate: 0,
        opacity: 1,
      },
      signature: {
        type: "signature",
        position: {
          x: 115.22,
          y: 235.43,
        },
        width: 62.5,
        height: 37.5,
      },
    },
  ],
  basePdf:
    "data:application/pdf;base64,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cGdvZG0gWzQgMCBSIC9YWVogNzIgNjYyLjI1IDBdCi9oLnFyMTBmcXJzMWFvbyBbNCAwIFIgL1hZWiAzMjQgNjk2Ljc1IDBdCi9oLnI2dm41ZDR0c2JxbCBbNCAwIFIgL1hZWiAzMjQgNDk1IDBdCi9oLjJtNHFscm9kZDU5bCBbNCAwIFIgL1hZWiAzMjQgMjQ4LjI1IDBdCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbNCAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgovRGVzdHMgMjQgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UaXRsZSAoUGV0IHJlc3VtZSkKL1Byb2R1Y2VyIChpTG92ZVBERikKL01vZERhdGUgKEQ6MjAyMjAxMTgwNTA1NTdaKQo+PgplbmRvYmoKeHJlZgowIDI1CjAwMDAwMDAwMTcgNjU1MzUgZg0KMDAwMDAxMzcyMSAwMDAwMCBuDQowMDAwMDEzNjY0IDAwMDAwIG4NCjAwMDAwMTM3ODQgMDAwMDAgbg0KMDAwMDAxMzI1MCAwMDAwMCBuDQowMDAwMDExNjM1IDAwMDAwIG4NCjAwMDAwMDAwMTUgMDAwMDAgbg0KMDAwMDAwNTUzMSAwMDAwMCBuDQowMDAwMDA0NzY5IDAwMDAwIG4NCjAwMDAwMDQ1NjMgMDAwMDAgbg0KMDAwMDAwMDA1NCAwMDAwMCBuDQowMDAwMDA1MTYwIDAwMDAwIG4NCjAwMDAwMTEwOTAgMDAwMDAgbg0KMDAwMDAxMDI5MSAwMDAwMCBuDQowMDAwMDEwMDg3IDAwMDAwIG4NCjAwMDAwMDU2ODMgMDAwMDAgbg0KMDAwMDAxMDY5MyAwMDAwMCBuDQowMDAwMDAwMDE4IDAwMDAwIGYNCjAwMDAwMDAwMTkgMDAwMDAgZg0KMDAwMDAwMDAyMSAwMDAwMCBmDQowMDAwMDExMjQxIDAwMDAwIG4NCjAwMDAwMDAwMDAgMDAwMDAgZg0KMDAwMDAxMTQzOCAwMDAwMCBuDQowMDAwMDExNDE5IDAwMDAwIG4NCjAwMDAwMTM0NDAgMDAwMDAgbg0KdHJhaWxlcgo8PAovU2l6ZSAyNQovUm9vdCAxIDAgUgovSW5mbyAzIDAgUgovSUQgWzwwNTRCNjVBODdDRUFBOEU2Q0U1MEM5NjUwRTQ3QTRDNT4gPEZCNTQ4M0NDNUQwMEMzRjg2NEQyNzEwRUIzNDg0OEU1Pl0KPj4Kc3RhcnR4cmVmCjEzODc1CiUlRU9GCg==",
  sampledata: [
    {
      name: "Pet Name",
      photo:
        "data:image/png;base64,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",
      age: "4 years",
      sex: "Male",
      weight: "33 pounds",
      breed: "Mutt",
      owner: "https://pdfme.com/",
      signature:
        "data:image/png;base64,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",
    },
  ],
  columns: [
    "name",
    "photo",
    "age",
    "sex",
    "weight",
    "breed",
    "owner",
    "signature",
  ],
});
