/**
 * Utility functions for interacting with the external salary system.
 * These functions handle data transformation and formatting required by the salary system API.
 */

/**
 * Extracts only the numeric part from a passport number.
 * The salary system requires passport numbers to be numeric only.
 * 
 * @param {string} passport - The full passport number (can contain letters and numbers)
 * @returns {string|null} - Returns only the numeric part or null if invalid
 * 
 * Example:
 * - Input: "AB123456" → Output: "123456"
 * - Input: "X-9876543" → Output: "9876543"
 */

import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import https from "https";

dayjs.extend(utc);
dayjs.extend(timezone);

export const extractNumberFromPassport = (passport) => {
  if (!passport) return null;
  const numericPart = passport.replace(/\D/g, '');
  return numericPart || null;
};

/**
 * Converts our gender format to the salary system's numeric code.
 * Salary system uses:
 * - 1 for Male (zachar)
 * - 2 for Female (nekeva)
 * 
 * @param {string} gender - The gender value from our system ('MALE' or 'FEMALE')
 * @returns {number} - Returns 1 for male, 2 for female, defaults to 1
 */
export const getGenderCode = (gender) => {
  if (!gender) return 1; // Default to male if not specified
  return gender === 'MALE' ? 1 : 2;
};

/**
 * Converts our marital status to the salary system's numeric code.
 * 
 * Salary system codes:
 * - 1 = Single (ravak)
 * - 2 = Married (nasuy)
 * - 3 = Divorced (garush)
 * - 4 = Widowed (alman)
 * - 5 = Separated (parud) - only for Israeli citizens
 * 
 * @param {string} status - Our system's marital status
 * @returns {number} - Salary system marital status code
 */
export const getMaritalStatusCode = (status) => {
  const statusMap = {
    'SINGLE': 1,
    'MARRIED': 2,
    'DIVORCED': 3,
    'WIDOWED': 4
  };
  return statusMap[status] || 1; // Default to single if status is unknown
};

/**
 * Formats worker data according to the salary system's requirements.
 * This is the main transformation function that converts our worker data
 * to the format expected by the salary system.
 * 
 * @param {Object} worker - Our system's worker data with all relations
 * @returns {Object} - Formatted data for the salary system
 */
export const formatWorkerDataForSalarySystem = (worker) => {
  const passportNumberOnly = extractNumberFromPassport(worker.passport);

  return {
    sug: "OVED", // Constant: indicates this is a worker record
    mispar_tz: String(passportNumberOnly), // Required: ID/passport number (numbers only)
    shem_mishpacha: worker.surname || worker.surnameHe || "", // Required: last name
    shem_praty: worker.name || worker.nameHe || "", // Required: first name
    sex: getGenderCode(worker.sex),
    taarich_leida: worker.birthday 
      ? dayjs(worker.birthday).format("YYYY-MM-DD") 
      : "",
    
    // Address details - Now using the new fields
    rechov: worker.street || "", // Street name
    mispar_bait: worker.houseNumber || "", // House number
    mispar_dira: worker.apartment || "", // Apartment number
    yeshuv: worker.city?.nameInHebrew || "", // City name in Hebrew
    mikud: worker.postalCode || "0", // Postal code
    
    // Contact details
    mispar_telephon: worker.secondaryPhone || "", // Secondary phone
    mispar_nayad: worker.primaryPhone || "", // Primary phone
    email: worker.email || "salaries@wavesmartflow.co.il",
    
    // Worker identification and status
    kod_oved: String(worker.workerCode || ""), // Worker's code in the system
    mazav_mishpachti: getMaritalStatusCode(worker.maritalStatus),
    toshav_israel: true, // Indicates resident (not citizen)
    chaver_kibuz: false, // Not a kibbutz member
    kupat_holim: 1, // Health insurance fund (1 = Clalit)
    
    // Employment dates
    taarich_tchilat_avoda_hashana: worker.inscriptionDate 
      ? dayjs(worker.inscriptionDate).tz("Asia/Jerusalem").format("YYYY-MM-DD")
      : dayjs().tz("Asia/Jerusalem").format("YYYY-MM-DD"),
    
    // Foreign worker specific fields
    zar: true, // Indicates foreign worker
    darkon_zar: worker.passport || "", // Full passport number
    medinat_moza_zar: worker.country?.code || "", // Country of origin code
    medinat_amana: false, // Not from a treaty country
    anaf_zar: 5, // Industry code (5 = construction)
    ishur_avoda_zar: true, // Has work permit
    zar_zikuy_israeli: false, // No Israeli tax credits
    
    // Bank account details - Now using the new fields
    bank_zar: worker.bank?.bankNumber || "20", // Bank code for foreign workers
    snif_zar: worker.branch?.code || "", // Branch code
    cheshbon_zar: worker.bankAccountNumber || "", // Account number
    
    // Arrival date
    taarich_hagaa: worker.entryDate 
      ? dayjs(worker.entryDate).tz("Asia/Jerusalem").format("YYYY-MM-DD")
      : "",
    
    // Regular bank account
    bank: [{
      bank: Number(worker.bank?.bankNumber || 0),
      snif: Number(worker.branch?.code || 0),
      cheshbon: worker.bankAccountNumber || "",
      achuz: 100 // Percentage of salary to this account
    }]
  };
};

/**
 * Creates an https agent that skips SSL verification.
 * WARNING: This should only be used for development or when certificates are self-signed.
 * 
 * @returns {https.Agent} - Configured https agent
 */
export const createHttpsAgent = () => {
  return new https.Agent({
    rejectUnauthorized: false
  });
}; 