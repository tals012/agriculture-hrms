/**
 * Utility functions for salary calculations based on Israeli labor law rates.
 */

// Law-mandated hourly rates
export const LAW_RATES = {
  RATE_100: 32.3,
  RATE_125: 40.37,
  RATE_150: 48.45
};

/**
 * Calculates salary when bonus is paid.
 * In this case, all hours (regular and overtime) are paid at the base rate.
 */
export function calculateSalaryWithBonus({
  hours100 = 0,
  hours125 = 0,
  hours150 = 0
}) {
  const regularHoursValue = hours100 * LAW_RATES.RATE_100;
  const overtimeHoursValue = (hours125 + hours150) * LAW_RATES.RATE_100;
  
  return {
    regularHoursValue,
    overtimeHoursValue,
    total: regularHoursValue + overtimeHoursValue
  };
}

/**
 * Calculates salary when bonus is not paid.
 * Each type of hour is paid at its respective law-mandated rate.
 */
export function calculateSalaryWithoutBonus({
  hours100 = 0,
  hours125 = 0,
  hours150 = 0
}) {
  const regularHoursValue = hours100 * LAW_RATES.RATE_100;
  const hours125Value = hours125 * LAW_RATES.RATE_125;
  const hours150Value = hours150 * LAW_RATES.RATE_150;
  
  return {
    regularHoursValue,
    hours125Value,
    hours150Value,
    total: regularHoursValue + hours125Value + hours150Value
  };
}

/**
 * Formats salary data for the external salary system based on bonus setting.
 */
export function formatSalaryForExternalSystem({
  hours100 = 0,
  hours125 = 0,
  hours150 = 0,
  isBonusPaid = false
}) {
  if (isBonusPaid) {
    const { regularHoursValue, overtimeHoursValue } = calculateSalaryWithBonus({
      hours100,
      hours125,
      hours150
    });

    return [
      {
        shem: "שעות רגילות 100%",
        kod: "1000",
        taarif: LAW_RATES.RATE_100,
        kamut: hours100,
        gilum: false,
        kovea_kizva: 1
      },
      {
        shem: "שעות נוספות",
        kod: "1001",
        taarif: LAW_RATES.RATE_100,
        kamut: hours125 + hours150,
        gilum: false,
        kovea_kizva: 1
      }
    ];
  }

  return [
    {
      shem: "שעות רגילות 100%",
      kod: "1000",
      taarif: LAW_RATES.RATE_100,
      kamut: hours100,
      gilum: false,
      kovea_kizva: 1
    },
    {
      shem: "שעות נוספות 125%",
      kod: "1001",
      taarif: LAW_RATES.RATE_125,
      kamut: hours125,
      gilum: false,
      kovea_kizva: 1
    },
    {
      shem: "שעות נוספות 150%",
      kod: "1002",
      taarif: LAW_RATES.RATE_150,
      kamut: hours150,
      gilum: false,
      kovea_kizva: 1
    }
  ];
} 