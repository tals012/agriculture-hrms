# Schedule Management System Documentation

## Overview

This documentation covers four main server actions that handle schedule management in the system:
1. `generateSchedule.js` - Creates new schedule templates
2. `getSchedule.js` - Retrieves planned schedules
3. `updateWorkingSchedule.js` - Updates actual attendance records
4. `getWorkingSchedule.js` - Retrieves actual working schedules with attendance

## Flow Diagram

```
┌─────────────────┐     ┌────────────────┐     ┌───────────────────────┐     ┌──────────────────────┐
│ generateSchedule│ ──> │   getSchedule  │ ──> │ updateWorkingSchedule │ ──> │   getWorkingSchedule │
│  (Templates)    │     │  (Plan/Future) │     │  (Actual Records)     │     │  (Actual/Historical) │
└─────────────────┘     └────────────────┘     └───────────────────────┘     └──────────────────────┘
```

## 1. generateSchedule.js

### Purpose
Creates schedule templates that define working hours, break times, and days per week for different entities.

### Key Features
- Handles paid/unpaid break time calculations
- Supports multiple schedule sources (Worker, Group, Field, Client, Organization)
- Calculates actual working hours for future salary calculations
- Supports overtime window calculations (100%, 125%, 150%)

### Input Parameters
```javascript
{
  numberOfTotalHoursPerDay: number,  // 1-24 hours
  numberOfTotalDaysPerWeek: number,  // 1-7 days
  startTimeInMinutes: number,        // 0-1440 minutes
  breakTimeInMinutes: number,        // 0-240 minutes
  isBreakTimePaid: boolean,         // Affects total working hours
  numberOfTotalHoursPerDayWindow100: number, // Regular hours (up to 8)
  numberOfTotalHoursPerDayWindow125: number, // First overtime window (8-10)
  numberOfTotalHoursPerDayWindow150: number, // Second overtime window (10+)
  clientId?: string,                // Optional
  groupId?: string,                 // Optional
  workerId?: string                 // Optional
}
```

### Break Time Logic
```javascript
// When breaks are unpaid:
actualHours = totalHours - (breakMinutes / 60)

// When breaks are paid:
actualHours = totalHours
```

## 2. getSchedule.js

### Purpose
Retrieves planned schedules for a specific month, showing what the schedule should be according to the template.

### Key Features
- Generates daily schedule for entire month
- Handles weekend calculations based on working days per week
- Supports schedule hierarchy (Worker > Group > Field > Client > Organization)

### Input Parameters
```javascript
{
  clientId?: string,
  fieldId?: string,
  groupId?: string,
  workerId?: string,
  month: number,    // 1-12
  year: number      // 2024-2100
}
```

### Output Structure
```javascript
{
  schedule: WorkingSchedule,      // Template details
  dailySchedule: Array<{         // Daily breakdown
    date: string,
    dayOfWeek: number,
    isWeekend: boolean,
    scheduleType: "WEEKEND" | "WORKING_DAY",
    startTimeInMinutes: number,
    endTimeInMinutes: number,
    breakTimeInMinutes: number,
    isBreakTimePaid: boolean,
    totalWorkingHours: number,
    scheduleSource: string
  }>,
  metadata: {                    // Monthly summary
    month: number,
    year: number,
    totalDays: number,
    workingDays: number,
    weekendDays: number,
    scheduleSource: string
  }
}
```

## 3. updateWorkingSchedule.js

### Purpose
Updates actual attendance records for workers, handling both creation of new records and updates to existing ones.

### Key Features
- Creates or updates daily attendance records
- Handles break time calculations for actual worked hours
- Manages worker's personal schedule creation if needed
- Supports various attendance statuses (WORKING, SICK_LEAVE, etc.)
- Maintains connection with pricing combinations and groups
- Calculates overtime windows based on Israeli labor laws

### Input Parameters
```javascript
{
  workerId: string,              // Required
  date: string,                  // Required - ISO date string
  startTimeInMinutes?: number,   // Optional
  endTimeInMinutes?: number,     // Optional
  breakTimeInMinutes?: number,   // Optional
  totalHoursWorked?: number,     // Optional
  totalContainersFilled?: number,// Optional
  isBreakTimePaid?: boolean,     // Optional, defaults to false
  status?: AttendanceStatus      // Optional, defaults to "WORKING"
}
```

### Overtime Window Calculation
```javascript
// Calculate total working hours based on break time payment status
const totalMinutes = endTime - startTime;
const calculatedTotalHours = isPaidBreak
  ? totalMinutes / 60  // If break is paid, include break time
  : (totalMinutes - breakTime) / 60;  // If break is unpaid, subtract break time

// Calculate overtime windows based on Israeli labor laws
const hoursWindow100 = Math.min(calculatedTotalHours, 8);
const hoursWindow125 = Math.min(Math.max(calculatedTotalHours - 8, 0), 2);
const hoursWindow150 = Math.min(Math.max(calculatedTotalHours - 10, 0), 2);
```

3. Attendance Status Options:
   - WORKING
   - SICK_LEAVE
   - DAY_OFF
   - HOLIDAY
   - INTER_VISA
   - NO_SCHEDULE
   - ABSENT
   - DAY_OFF_PERSONAL_REASON
   - WEEKEND
   - ACCIDENT
   - NOT_WORKING_BUT_PAID

4. Priority System:
   - Checks for existing personal schedule
   - Falls back to group/field/client/organization schedule
   - Creates personal schedule if needed

## 4. getWorkingSchedule.js

### Purpose
Retrieves actual working schedules with attendance records, showing what actually happened vs what was planned.

### Key Features
- Combines planned schedule with actual attendance
- Calculates actual working hours based on attendance records
- Handles break time calculations for actual worked hours
- Used for salary calculations (based on actual hours worked)
- Provides detailed overtime window breakdowns

### Input Parameters
```javascript
{
  clientId?: string,
  fieldId?: string,
  groupId?: string,
  workerId?: string,
  startDate: Date,
  endDate: Date
}
```

### Break Time Calculation
```javascript
// For each attendance record:
if (!isBreakTimePaid) {
  actualWorkingHours = totalHours - (breakMinutes / 60)
} else {
  actualWorkingHours = totalHours
}
```

### Output Structure
```javascript
{
  schedule: WorkingSchedule,      // Template details
  dailySchedule: Array<{         // Daily breakdown
    date: string,
    dayOfWeek: number,
    isWeekend: boolean,
    scheduleType: "WEEKEND" | "WORKING_DAY",
    startTimeInMinutes: number,
    endTimeInMinutes: number,
    breakTimeInMinutes: number,
    isBreakTimePaid: boolean,
    totalWorkingHours: number,
    totalWorkingHoursWindow100: number,  // Regular hours
    totalWorkingHoursWindow125: number,  // First overtime window
    totalWorkingHoursWindow150: number,  // Second overtime window
    scheduleSource: string
  }>,
  metadata: {                    // Monthly summary
    month: number,
    year: number,
    totalDays: number,
    workingDays: number,
    weekendDays: number,
    scheduleSource: string,
    attendance?: {
      totalRecords: number,
      totalContainers: number,
      totalHours: number,
      totalHours100: number,     // Total regular hours
      totalHours125: number,     // Total first overtime window
      totalHours150: number,     // Total second overtime window
      byProduct: Array<{
        harvestType: string,
        species: string,
        containers: number
      }>
    }
  }
}
```

## Schedule Priority System

The system follows a strict priority hierarchy when finding schedules:

1. Worker Schedule (Most specific)
2. Group Schedule
3. Field Schedule
4. Client Schedule
5. Organization Schedule (Most general)

## Database Models Used

Key models from schema.prisma:
- WorkingSchedule: Stores schedule templates
- WorkerAttendance: Stores actual attendance records
- Worker: Contains worker information
- Group: Contains group information
- Field: Contains field information
- Client: Contains client information
- Organization: Contains organization information

## Usage Examples

### Creating a New Schedule
```javascript
const result = await generateSchedule({
  numberOfTotalHoursPerDay: 8,
  numberOfTotalDaysPerWeek: 6,
  startTimeInMinutes: 480, // 8:00 AM
  breakTimeInMinutes: 30,
  isBreakTimePaid: false,
  workerId: "worker_123"
});
```

### Getting Monthly Schedule
```javascript
const schedule = await getSchedule({
  workerId: "worker_123",
  month: 3,
  year: 2024
});
```

### Getting Actual Working Schedule
```javascript
const workingSchedule = await getWorkingSchedule({
  workerId: "worker_123",
  startDate: new Date("2024-03-01"),
  endDate: new Date("2024-03-31")
});
```

## Important Notes

1. Break Time Handling:
   - Unpaid breaks reduce total working hours
   - Paid breaks are included in total working hours
   - This affects salary calculations

2. Overtime Windows:
   - Window 100%: First 8 hours of work
   - Window 125%: Hours 9-10 (up to 2 hours)
   - Window 150%: Hours beyond 10
   - Calculations follow Israeli labor laws
   - Break time payment status affects window calculations

3. Table Display:
   - Shows all three overtime windows separately
   - Formats hours with 2 decimal places
   - Provides totals for each overtime window in stats
   - Updates automatically when attendance is modified

4. Weekend Handling:
   - 5 working days: Friday and Saturday are weekends
   - 6 working days: Only Saturday is weekend
   - 7 working days: No weekends

5. Schedule Sources:
   - Each schedule record includes its source
   - Higher priority sources override lower ones
   - Changes to templates don't affect historical records

6. Future Salary Calculations:
   - Based on actual working hours from getWorkingSchedule
   - Accounts for paid/unpaid break times
   - Uses attendance records for accuracy

7. Attendance Record Updates:
   - Updates affect only the specific date
   - Maintains historical record accuracy
   - Critical for accurate salary calculations
   - Handles both creation and updates seamlessly 

## Overtime Windows

The system implements Israeli labor law requirements for overtime calculations using three windows:

### Window Definitions
1. Regular Hours (100%):
   - First 8 hours of work per day
   - Example: For an 8-hour day → 8.00 hours at 100%

2. First Overtime Window (125%):
   - Hours worked between 8-10 hours per day
   - Maximum of 2 hours in this window
   - Example: For a 9-hour day → 8.00 hours at 100%, 1.00 hour at 125%

3. Second Overtime Window (150%):
   - Hours worked between 10-12 hours per day
   - Maximum of 2 hours in this window
   - Example: For an 11-hour day → 8.00 hours at 100%, 2.00 hours at 125%, 1.00 hour at 150%

### Examples
```javascript
// 8-hour workday
{
  hoursWindow100: "8.00",
  hoursWindow125: "0.00",
  hoursWindow150: "0.00"
}

// 9-hour workday
{
  hoursWindow100: "8.00",
  hoursWindow125: "1.00",
  hoursWindow150: "0.00"
}

// 10-hour workday
{
  hoursWindow100: "8.00",
  hoursWindow125: "2.00",
  hoursWindow150: "0.00"
}

// 11-hour workday
{
  hoursWindow100: "8.00",
  hoursWindow125: "2.00",
  hoursWindow150: "1.00"
}

// 12-hour workday (maximum)
{
  hoursWindow100: "8.00",
  hoursWindow125: "2.00",
  hoursWindow150: "2.00"
}
```

### Implementation Details

1. In Schedule Templates (`generateSchedule.js`):
   ```javascript
   numberOfTotalHoursPerDayWindow100 = Math.min(actualTotalHoursPerDay, 8)
   numberOfTotalHoursPerDayWindow125 = Math.min(Math.max(actualTotalHoursPerDay - 8, 0), 2)
   numberOfTotalHoursPerDayWindow150 = Math.min(Math.max(actualTotalHoursPerDay - 10, 0), 2)
   ```

2. In Attendance Records (`updateWorkingSchedule.js`):
   ```javascript
   hoursWorkedWindow100 = Math.min(calculatedTotalHours, 8)
   hoursWorkedWindow125 = Math.min(Math.max(calculatedTotalHours - 8, 0), 2)
   hoursWorkedWindow150 = Math.min(Math.max(calculatedTotalHours - 10, 0), 2)
   ```

### Important Notes

1. Maximum Working Hours:
   - System enforces a maximum of 12 working hours per day
   - This includes both regular and overtime hours
   - Break time may affect total hours based on `isBreakTimePaid` setting

2. Break Time Impact:
   - Paid breaks are included in total hours before window calculations
   - Unpaid breaks are subtracted from total hours before window calculations

3. Display in UI:
   - Each window is shown separately in the table
   - Totals for each window are calculated in the statistics section
   - Weekend days show "-" for all windows
   - Planned schedules show default values (8.00/0.00/0.00)

4. Future Salary Calculations:
   - These windows will be used for calculating different pay rates
   - 100% window → Base pay rate
   - 125% window → 1.25× base pay rate
   - 150% window → 1.50× base pay rate 

## Container and Time Calculations

The system implements a bidirectional calculation system between containers filled and working hours:

### Container-Based Calculations
When containers are updated, the system calculates hours proportionally:
```javascript
// If containerNorm = 3 and containersFilled = 3 → totalHours = 8
// If containerNorm = 3 and containersFilled = 1.5 → totalHours = 4
const totalHours = (containersFilled / containerNorm) * 8;

// Calculate end time based on total hours
const endTimeInMinutes = startTimeInMinutes + Math.round(totalHours * 60);
```

### Time-Based Calculations
When start/end times are updated, the system calculates containers proportionally:
```javascript
// Calculate total hours from times
const totalHours = (endTimeInMinutes - startTimeInMinutes) / 60;

// Calculate containers based on hours
// If totalHours = 8 and containerNorm = 4 → containers = 4
// If totalHours = 4 and containerNorm = 3 → containers = 1.5
const totalContainers = (totalHours / 8) * containerNorm;
```

### Dependencies and Validation
1. Pricing Combination Required:
   - Must select pricing combination before entering containers
   - Must select pricing combination before updating times
   - Pricing combination provides the container norm for calculations

2. Automatic Updates:
   - Updating containers recalculates hours and times
   - Updating times recalculates containers
   - Removing pricing combination clears containers

3. Calculation Priority:
   ```javascript
   if (hasContainersChanged || hasStartTimeChanged || hasEndTimeChanged || hasContainerNormChanged) {
     // Priority 1: Use containers if provided
     if (inputContainers !== undefined) {
       calculateFromContainers();
     }
     // Priority 2: Use times if available
     else if (inputStartTime !== undefined || inputEndTime !== undefined) {
       calculateFromTimes();
     }
   }
   ```

### Examples

1. Container-Based Updates:
   ```javascript
   // Container norm = 3
   containersFilled = 3  → totalHours = 8   (full day)
   containersFilled = 1.5 → totalHours = 4   (half day)
   containersFilled = 6   → totalHours = 16  (double day)
   ```

2. Time-Based Updates:
   ```javascript
   // Container norm = 4
   hours = 8 (08:00-16:00) → containers = 4
   hours = 4 (08:00-12:00) → containers = 2
   hours = 12 (08:00-20:00) → containers = 6
   ```

3. Overtime Windows:
   ```javascript
   // Based on total hours:
   hoursWindow100 = Math.min(totalHours, 8)
   hoursWindow125 = Math.min(Math.max(totalHours - 8, 0), 2)
   hoursWindow150 = Math.max(totalHours - 10, 0)
   ```

### Important Notes

1. Validation Rules:
   - Cannot enter containers without pricing combination
   - Cannot update times without pricing combination
   - All calculations require valid container norm

2. Rounding:
   - Container calculations rounded to 2 decimal places
   - Time calculations rounded to nearest minute
   - Hours displayed with 2 decimal places

3. State Management:
   - All calculations performed on backend
   - Frontend only displays values and sends updates
   - No local calculations in frontend to ensure consistency

4. Error Handling:
   - Clear error messages for missing pricing combination
   - Validation before any calculations
   - Proper null/undefined handling 