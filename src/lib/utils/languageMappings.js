import { countryCodeToIso3 } from "./countryCodesISO";

// Map ISO3 codes to language codes
const iso3ToLanguage = {
  IND: "hi", // Hindi
  MDA: "ro", // Romanian
  ISR: "he", // Hebrew
  USA: "en", // English
  GBR: "en", // English
  CHN: "zh", // Chinese
  RUS: "ru", // Russian
  SAU: "ar", // Arabic
  EGY: "ar", // Arabic
  THA: "th", // Thai
  LKA: "si", // Sinhala
  PAK: "ur", // Urdu
  BGD: "bn", // Bengali
  VNM: "vi", // Vietnamese
  IDN: "id", // Indonesian
  KOR: "ko", // Korean
  JPN: "ja", // Japanese
};

// RTL languages
const rtlLanguages = ["ar", "he", "fa", "ur"];

// Default translations for all languages
const defaultTranslations = {
  // Common buttons
  save: "Save",
  cancel: "Cancel",
  close: "Close",
  submit: "Submit",
  edit: "Edit",
  delete: "Delete",
  add: "Add",
  
  // Form labels
  name: "Name",
  email: "Email",
  phone: "Phone",
  address: "Address",
  city: "City",
  country: "Country",
  
  // PDF Form labels
  formEditor: "Form Editor",
  formDetails: "Form Details",
  formName: "Form Name",
  worker: "Worker",
  document: "Document",
  category: "Category",
  note: "Note",
  
  // PDF actions
  loadingTemplate: "Loading template...",
  pdfEditor: "PDF Editor",
  generateDocument: "Generate Document",
  download: "Download",
  print: "Print",
  
  // Signature dialog
  createSignature: "Add Signature",
  typeSignature: "Type",
  drawSignature: "Draw",
  typeHere: "Type your signature here",
  clear: "Clear",
  signHere: "Click to sign",
  
  // Errors
  error: "Error",
  errorMessage: "Please add a signature",
};

// Hebrew translations
const hebrewTranslations = {
  save: "שמור",
  cancel: "ביטול",
  close: "סגור",
  submit: "שלח",
  edit: "ערוך",
  delete: "מחק",
  add: "הוסף",
  
  name: "שם",
  email: "אימייל",
  phone: "טלפון",
  address: "כתובת",
  city: "עיר",
  country: "מדינה",
  
  formEditor: "עורך טפסים",
  formDetails: "פרטי הטופס",
  formName: "שם הטופס",
  worker: "עובד",
  document: "מסמך",
  category: "קטגוריה",
  note: "הערה",
  
  loadingTemplate: "טוען תבנית...",
  pdfEditor: "עורך PDF",
  generateDocument: "צור מסמך",
  download: "הורד",
  print: "הדפס",
  
  createSignature: "הוסף חתימה",
  typeSignature: "הקלדה",
  drawSignature: "ציור",
  typeHere: "הקלד את חתימתך כאן",
  clear: "נקה",
  signHere: "לחץ לחתימה",
  
  error: "שגיאה",
  errorMessage: "נא להוסיף חתימה",
};

// Arabic translations
const arabicTranslations = {
  save: "حفظ",
  cancel: "إلغاء",
  close: "إغلاق",
  submit: "إرسال",
  edit: "تعديل",
  delete: "حذف",
  add: "إضافة",
  
  name: "الاسم",
  email: "البريد الإلكتروني",
  phone: "الهاتف",
  address: "العنوان",
  city: "المدينة",
  country: "البلد",
  
  formEditor: "محرر النماذج",
  formDetails: "تفاصيل النموذج",
  formName: "اسم النموذج",
  worker: "العامل",
  document: "المستند",
  category: "الفئة",
  note: "ملاحظة",
  
  loadingTemplate: "جاري تحميل القالب...",
  pdfEditor: "محرر PDF",
  generateDocument: "إنشاء مستند",
  download: "تنزيل",
  print: "طباعة",
  
  createSignature: "إضافة توقيع",
  typeSignature: "كتابة",
  drawSignature: "رسم",
  typeHere: "اكتب توقيعك هنا",
  clear: "مسح",
  signHere: "انقر للتوقيع",
  
  error: "خطأ",
  errorMessage: "الرجاء إضافة توقيع",
};

// Language specific translations
const translations = {
  en: defaultTranslations,
  he: hebrewTranslations,
  ar: arabicTranslations,
};

/**
 * Get language code from country code
 * @param {string} countryCode - Country code (ISO numeric)
 * @returns {string} Language code (ISO 639-1)
 */
export const getLanguageFromCountryCode = (countryCode) => {
  try {
    // Convert country code to ISO3
    const iso3 = countryCodeToIso3(countryCode);
    console.log(`Country code ${countryCode} maps to ISO3 ${iso3}`);
    
    // Get language from ISO3
    const language = iso3ToLanguage[iso3] || "en";
    console.log(`ISO3 ${iso3} maps to language ${language}`);
    
    return language;
  } catch (error) {
    console.error("Error getting language from country code:", error);
    return "en";
  }
};

/**
 * Check if a language is RTL
 * @param {string} language - Language code (ISO 639-1)
 * @returns {boolean} Is RTL
 */
export const isRTLLanguage = (language) => {
  return rtlLanguages.includes(language);
};

/**
 * Get translations for a specific language
 * @param {string} language - Language code (ISO 639-1)
 * @returns {Object} Translations
 */
export const getTranslations = (language) => {
  // Get language specific translations or default to English
  const langTranslations = translations[language] || translations.en;
  
  // Ensure all keys from default translations exist
  const result = { ...defaultTranslations, ...langTranslations };
  
  return result;
}; 