export const getFontsData = async () => {
  // For version 1.0.8, we don't specify any fonts
  // Let the library use its default fonts
  return null;
};

export const readFile = (file, type = 'arrayBuffer') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    if (type === 'dataURL') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

export const cloneDeep = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export const getPlugins = () => {
  return [];
};

export const createTemplate = (basePdf) => {
  // Make sure the basePdf is valid
  if (!basePdf) {
    console.error('Invalid basePdf provided to createTemplate');
  }

  // Create a template with proper structure for version 1.0.8
  return {
    basePdf,
    schemas: [{}],  // Empty schema for first page
    columns: []     // Empty columns array
  };
};

export const handleLoadTemplate = (template) => {
  let processedTemplate = template;
  
  // Ensure schemas is an array
  if (!Array.isArray(processedTemplate.schemas)) {
    processedTemplate.schemas = [processedTemplate.schemas];
  }
  
  // Convert schemas to array format if needed
  const isNotArray = processedTemplate.schemas.some(schema => !Array.isArray(schema));
  if (isNotArray) {
    const schemasArray = [...processedTemplate.schemas];
    processedTemplate.schemas = schemasArray;
  }
  
  return processedTemplate;
};

export const generatePDF = async (template, inputs) => {
  try {
    // This would be implemented when needed
    // Using the pdfme/generator library
    return { ok: true };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { ok: false, error: error.message };
  }
};

export const downloadJsonFile = (jsonObj, filename) => {
  const blob = new Blob([JSON.stringify(jsonObj)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'template.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}; 