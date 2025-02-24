import dayjs from "dayjs";

export const createDayStatusRanges = (workerDaySchedules) => {
  workerDaySchedules.sort((a, b) => new Date(a.attendanceDate) - new Date(b.attendanceDate));

  const ranges = [];

  let currentRange = {};

  let startDate = dayjs(new Date(workerDaySchedules?.[0]?.attendanceDate));

  if (!startDate) {
    return [];
  }

  for (let i = 0; i < workerDaySchedules.length; i++) {
    currentRange.dayStatus = workerDaySchedules[i].dayStatus;
    if (!currentRange.startDate) {
      currentRange.startDate = startDate.format("YYYY-MM-DD");
    }

    if (workerDaySchedules[i + 1]) {
      const nextDate = dayjs(new Date(workerDaySchedules[i + 1].attendanceDate));
      if (nextDate.diff(startDate, "day") > 1) {
        currentRange.endDate = startDate.format("YYYY-MM-DD");
        ranges.push(currentRange);
        currentRange = {};
        startDate = nextDate;
      } else {
        if (
          workerDaySchedules[i].dayStatus !==
          workerDaySchedules[i + 1].dayStatus
        ) {
          currentRange.endDate = startDate.format("YYYY-MM-DD");
          ranges.push(currentRange);
          currentRange = {};
        }
        startDate = nextDate;
      }
    } else {
      currentRange.endDate = startDate.format("YYYY-MM-DD");
      ranges.push(currentRange);
    }
  }

  return ranges;
};
