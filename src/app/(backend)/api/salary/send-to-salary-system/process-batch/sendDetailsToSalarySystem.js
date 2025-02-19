"use server";

import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { extractNumberFromPassport } from "@/lib/utils/salarySystem";
import axios from "axios";
import https from "https";

dayjs.extend(utc);
dayjs.extend(timezone);

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export async function sendDetailsToSalarySystem({
  workerSubmissionsId,
  date,
  attendanceRecords,
}) {
  try {
    const submission =
      await prisma.workerMonthlyWorkingHoursSubmission.findUnique({
        where: { id: workerSubmissionsId },
        include: {
          worker: {
            include: {
              country: true,
              city: true,
              user: true,
              currentClient: true,
              groups: {
                where: { endDate: null },
                include: {
                  group: {
                    include: {
                      field: true,
                      clientPricingCombination: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!submission || !submission.worker) {
      throw new Error("Invalid submission or worker data");
    }

    const worker = submission.worker;
    const passportNumberOnly = extractNumberFromPassport(worker.passport);

    if (!passportNumberOnly) {
      throw new Error("Invalid passport number");
    }

    // Calculate project/field time distribution
    const projectTimeData = attendanceRecords.reduce((acc, record) => {
      if (!record.groupId) return acc;

      const group = worker.groups.find((g) => g.groupId === record.groupId);
      if (!group) return acc;

      const key = `${group.group.field.clientId}_${group.group.fieldId}`;
      if (!acc[key]) {
        acc[key] = {
          hours: 0,
          days: 0,
          clientName: group.group.field.client.name,
          fieldName: group.group.field.name,
        };
      }

      acc[key].hours += record.totalHoursWorked || 0;
      acc[key].days += record.status === "WORKING" ? 1 : 0;
      return acc;
    }, {});

    // Format data for salary system
    const baseMASKORET = {
      sug: "MASKORET",
      mispar_tz: String(passportNumberOnly),
      shem_mishpacha: worker.surname || worker.surnameHe || "",
      shem_praty: worker.name || worker.nameHe || "",
      chodesh: Number(date.month),
      shana: Number(date.year),
      misra: {
        sug: 2, // Hourly payment
        taarif: worker.groups[0]?.group?.clientPricingCombination?.price || 0,
        taarif_zurat_chishuv: 1,
        shaot_avoda:
          submission.totalMonthlyHours100 +
          submission.totalMonthlyHours125 +
          submission.totalMonthlyHours150,
        yamim_avoda: submission.workingDays || 0,
        shaot_teken_chodesh: 186, // Standard monthly hours
        shaot_teken_yom: 8.6, // Standard daily hours
        yamim_teken: 22, // Standard monthly working days
        yamim_shavua: 6, // Working days per week
        hekef_misra: 100,
      },
      avoda: {
        shiyuch: worker.currentClient?.name || "",
        shiyuch2: worker.groups[0]?.group?.field?.name || "",
        pizul_shiyuch: Object.values(projectTimeData).map((data) => ({
          shem_shiyuch: data.clientName,
          shaot: data.hours,
          yamim: data.days,
          achuz: (
            (data.hours /
              (submission.totalMonthlyHours100 +
                submission.totalMonthlyHours125 +
                submission.totalMonthlyHours150)) *
            100
          ).toFixed(2),
        })),
        pizul_shiyuch2: Object.values(projectTimeData).map((data) => ({
          shem_shiyuch: `${data.clientName} - ${data.fieldName}`,
          shaot: data.hours,
          yamim: data.days,
          achuz: (
            (data.hours /
              (submission.totalMonthlyHours100 +
                submission.totalMonthlyHours125 +
                submission.totalMonthlyHours150)) *
            100
          ).toFixed(2),
        })),
        taarich_vetek: dayjs(worker.inscriptionDate || worker.entryDate)
          .tz("Asia/Jerusalem")
          .format("YYYY-MM-DD"),
        sium_avoda: false,
      },
      tashlumim: [
        {
          shem: "שעות רגילות 100%",
          kod: "1000",
          taarif: worker.groups[0]?.group?.clientPricingCombination?.price || 0,
          kamut: submission.totalMonthlyHours100 || 0,
          gilum: false,
          kovea_kizva: 1,
        },
        {
          shem: "שעות נוספות 125%",
          kod: "1001",
          taarif:
            (worker.groups[0]?.group?.clientPricingCombination?.price || 0) *
            1.25,
          kamut: submission.totalMonthlyHours125 || 0,
          gilum: false,
          kovea_kizva: 1,
        },
        {
          shem: "שעות נוספות 150%",
          kod: "1002",
          taarif:
            (worker.groups[0]?.group?.clientPricingCombination?.price || 0) *
            1.5, // it needs tob
          kamut: submission.totalMonthlyHours150 || 0,
          gilum: false,
          kovea_kizva: 1,
        },



      ],
      shovayim: [],
      nikuyim: [],
      chufsha: [],
      machala: [],
      bank: [
        {
          bank: 0,
          snif: 0,
          cheshbon: "",
          achuz: 100,
        },
      ],
    };

    // Send to salary system
    const response = await axios.post(
      `https://salary.wavesmartflow.co.il/php/api.php?user=${process.env.SALARY_SYSTEM_USER_ID}&pass=${process.env.SALARY_SYSTEM_API_PASSWORD}`,
      baseMASKORET,
      {
        headers: {
          "Content-Type": "application/json",
        },
        httpsAgent,
      }
    );

    return {
      ok: !!response.data,
      data: response.data,
    };
  } catch (error) {
    console.error("Error sending details to salary system:", error);
    return {
      ok: false,
      message: error.message,
    };
  }
}
