"use server";

import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { extractNumberFromPassport } from "@/lib/utils/salarySystem";
import axios from "axios";
import https from "https";
import { LAW_RATES } from "@/lib/utils/salaryCalculation";
import { getOrganizationSettings } from "@/app/(backend)/actions/settings/getOrganizationSettings";
import { createDayStatusRanges } from "@/lib/utils/createDayStatusRanges";

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
              workingSchedule: true,
              bank: true,
              branch: true,
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

    // ! ===================================================================
    const weatherDays = attendanceRecords.filter(
      (i) => i.status === "NOT_WORKING_BUT_PAID" && !!i.isAvailable
    );

    const intervisaHolidaysAndDayOffDays = attendanceRecords.filter(
      (i) => i.status === "INTER_VISA" || i.status === "DAY_OFF"
    );

    const accidentDays = attendanceRecords.filter(
      (i) => i.status === "ACCIDENT"
    );

    const intervisaHolidaysAndDayOffConsecutiveDaysRange =
      createDayStatusRanges(intervisaHolidaysAndDayOffDays);

    const accidentDaysConsecutiveDaysRange =
      createDayStatusRanges(accidentDays);

    const sickDays = attendanceRecords.filter((i) => i.status === "SICK_LEAVE");

    const sickDaysConsecutiveDaysRange = createDayStatusRanges(sickDays);

    const holidays = attendanceRecords.filter((i) => i.status === "HOLIDAY");
    // ! ===================================================================

    // * Get organization settings
    const orgSettings = await getOrganizationSettings();
    if (orgSettings.status !== 200) {
      return orgSettings;
    }

    // Get existing schedule for default values
    const existingPersonalSchedule = await prisma.workingSchedule.findFirst({
      where: { workerId: worker.id },
      orderBy: { createdAt: "desc" },
    });

    // Get current schedule following priority system if no personal schedule exists
    let currentSchedule;
    if (!existingPersonalSchedule) {
      currentSchedule = await prisma.workingSchedule.findFirst({
        where: {
          OR: [
            { groupId: worker.groups[0].groupId },
            { fieldId: worker.groups[0].group.fieldId },
            { clientId: worker.currentClientId },
            { organizationId: { not: null } },
          ],
        },
        orderBy: [
          { workerId: "desc" },
          { groupId: "desc" },
          { fieldId: "desc" },
          { clientId: "desc" },
          { organizationId: "desc" },
          { createdAt: "desc" },
        ],
      });
    }

    let isBonusPaid = false;

    if (existingPersonalSchedule) {
      isBonusPaid = existingPersonalSchedule.isBonusPaid;
    } else if (currentSchedule) {
      isBonusPaid = currentSchedule.isBonusPaid;
    }

    // ! Calculate project/field time distribution
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

    // ! Format data for salary system
    let baseMASKORET = {
      sug: "MASKORET",
      mispar_tz: String(passportNumberOnly), // & Worker's passport number (only numbers)
      shem_mishpacha: worker.surname || worker.surnameHe || "", // & Worker's last name
      shem_praty: worker.name || worker.nameHe || "", // & Worker's name
      chodesh: Number(date.month) + 1, // & Month (1-12)
      shana: Number(date.year), // & Year (YYYY)
      misra: {
        sug: 2, // & 2 for Hourly payment
        taarif: Number(LAW_RATES.RATE_100), // & Hourly rate
        taarif_zurat_chishuv: 1, // & Calculation basis (always 1 for yadani)
        // shaot_avoda:
        //   submission.totalMonthlyHours100 +
        //   submission.totalMonthlyHours125 +
        //   submission.totalMonthlyHours150,
        shaot_avoda: submission.totalMonthlyHours, // & total hours worked this month
        yamim_avoda: submission.workingDays || 0, // & days worked this month
        shaot_teken_chodesh:
          (worker.workingSchedule.numberOfTotalDaysPerMonth || 0) *
          (worker.workingSchedule.numberOfTotalHoursPerDay || 0), // & Standard monthly hours
        shaot_teken_yom: worker.workingSchedule.numberOfTotalHoursPerDay || 0, // & Standard daily hours
        yamim_teken: worker.workingSchedule.numberOfTotalDaysPerMonth || 0, // & Standard monthly working days
        yamim_shavua: worker.workingSchedule.numberOfTotalDaysPerWeek || 0, // & Working days per week
        hekef_misra: 100, // & Percentage increase in salary
      },
      avoda: {
        shiyuch: worker.currentClient?.name || "", // & Primary project or department
        shiyuch2: worker.groups[0]?.group?.field?.name || "", // & Secondary project or department
        pizul_shiyuch: Object.values(projectTimeData).map((data) => ({
          shem_shiyuch: data.clientName,
          shaot: data.hours,
          yamim: data.days,
          // achuz: (
          //   (data.hours /
          //     (submission.totalMonthlyHours100 +
          //       submission.totalMonthlyHours125 +
          //       submission.totalMonthlyHours150)) *
          //   100
          // ).toFixed(2),
          achuz: ((data.hours / submission.totalMonthlyHours) * 100).toFixed(2),
        })),
        pizul_shiyuch2: Object.values(projectTimeData).map((data) => ({
          shem_shiyuch: `${data.clientName} - ${data.fieldName}`,
          shaot: data.hours,
          yamim: data.days,
          // achuz: (
          //   (data.hours /
          //     (submission.totalMonthlyHours100 +
          //       submission.totalMonthlyHours125 +
          //       submission.totalMonthlyHours150)) *
          //   100
          // ).toFixed(2),
          achuz: ((data.hours / submission.totalMonthlyHours) * 100).toFixed(2),
        })),
        taarich_vetek: dayjs(worker.inscriptionDate || worker.entryDate)
          .tz("Asia/Jerusalem")
          .format("YYYY-MM-DD"), // & Start date of employment (YYYY-MM-DD)
        sium_avoda: false,
      },
      tashlumim: [
        {
          shem: "שעות רגילות 100%",
          kod: "1000",
          taarif: Number(LAW_RATES.RATE_100), // & law rate
          kamut: Number(submission.totalMonthlyHours100).toFixed(2) || 0,
          gilum: false,
          kovea_kizva: 1,
          teur: "",
          teur_same_line: true,
        },
        ...(!isBonusPaid && {
          shem: "שעות נוספות 125%",
          kod: "1001",
          taarif: Number(LAW_RATES.RATE_125), // & law rate
          kamut: Number(submission.totalMonthlyHours125).toFixed(2) || 0,
          gilum: false,
          kovea_kizva: 1,
          teur: "",
          teur_same_line: true,
        }),
        ...(!isBonusPaid && {
          shem: "שעות נוספות 150%",
          kod: "1002",
          taarif: Number(LAW_RATES.RATE_150), // & law rate
          kamut: Number(submission.totalMonthlyHours150).toFixed(2) || 0,
          gilum: false,
          kovea_kizva: 1,
          teur: "",
          teur_same_line: true,
        }),
        ...(isBonusPaid && {
          shem: "בונוס",
          kod: "1003",
          taarif: Number(LAW_RATES.RATE_100), // & law rate
          kamut: Number(submission.totalBonus).toFixed(2) || 0,
          gilum: false,
          kovea_kizva: 1,
          teur: "",
          teur_same_line: true,
        }),
      ],
      shovayim: [],
      nikuyim: [],
      chufsha: intervisaHolidaysAndDayOffConsecutiveDaysRange.map((day) => {
        return {
          taarich_hatchala: dayjs(day.startDate)
            .tz("Asia/Jerusalem")
            .format("YYYY-MM-DD"),
          taarich_sium: dayjs(day.endDate)
            .tz("Asia/Jerusalem")
            .format("YYYY-MM-DD"),
          zakaut: 0,
          zakaut_auto: true,

          nizul: 0,
          nizul_auto: true,
          yitra_kodemet: 0,
          yitra_kodemet_auto: true,
          teur: "",
          ...(day.status === "INTER_VISA" && { zarim_sug: 4 }),
        };
      }),

      machala: sickDaysConsecutiveDaysRange.map((day) => {
        return {
          taarich_hatchala: dayjs(day.startDate)
            .tz("Asia/Jerusalem")
            .format("YYYY-MM-DD"),
          taarich_sium: dayjs(day.endDate)
            .tz("Asia/Jerusalem")
            .format("YYYY-MM-DD"),
          zakaut: 0,
          zakaut_auto: true,
          nizul: 0,
          nizul_auto: true,
          yitra_kodemet: 0,
          yitra_kodemet_auto: true,
          teur: "",
        };
      }),
      zurat_tashlum: 1,
      bank: [
        {
          bank: Number(worker?.bank?.bankNumber || 0),
          snif: Number(worker?.branch?.branchId || 0),
          cheshbon: Number(worker?.bankAccountNumber || 0),
          achuz: 100,
        },
      ],
    };

    if (weatherDays.length > 0) {
      baseMASKORET.tashlumim.unshift({
        shem: "WEATHER", // Premia
        kod: "1008",
        taarif: Number(LAW_RATES.RATE_100),
        kamut: Number(
          weatherDays.reduce(
            (acc, day) => acc + (day.totalHoursWorked || 0),
            0
          ) || 0
        ).toFixed(2), // always 0
        gilum: false, // always true
        kovea_kizva: 1,
        teur: "WEATHER",
        teur_same_line: true,
      });
    }

    if (accidentDaysConsecutiveDaysRange.length > 0) {
      accidentDaysConsecutiveDaysRange.forEach((day) => {
        baseMASKORET.chufsha.unshift({
          taarich_hatchala: dayjs(day.startDate)
            .tz("Asia/Jerusalem")
            .format("YYYY-MM-DD"),
          taarich_sium: dayjs(day.endDate)
            .tz("Asia/Jerusalem")
            .format("YYYY-MM-DD"),
          zakaut: 0,
          zakaut_auto: true,
          nizul: 0,
          nizul_auto: true,
          yitra_kodemet: 0,
          yitra_kodemet_auto: true,
          teur: "",
          // ...(day.status === "ACCIDENT"
          //   ? payingForWorkerAccident
          //     ? { teunat_avoda_tashlum: 6 }
          //     : { teunat_avoda_lelo_tashlum: 7 }
          //   : {}),
          ...(day.status === "ACCIDENT" && {
            teunat_avoda_tashlum: 6,
          }),
        });
      });
    }

    // ! Send to salary system
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
