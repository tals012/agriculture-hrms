# Scripts

This directory contains utility scripts for the Agriculture HRMS application.

## Worker Serial Number Update

The `updateWorkerSerialNumbers.js` script assigns sequential serial numbers to all existing workers based on their creation date.

### When to use this script

This script should be run after adding the `serialNumber` field to the `Worker` model in the schema. It's a one-time migration script to ensure all existing workers get a serial number assigned.

### Before running the script

1. Make sure you have added the `serialNumber` field to the `Worker` model in `prisma/schema.prisma`
2. Run a Prisma migration to update the database schema:
   ```bash
   npx prisma migrate dev --name add_worker_serial_number
   ```

### Running the script

Execute the script using Node.js:

```bash
node scripts/updateWorkerSerialNumbers.js
```

This will:

1. Fetch all workers ordered by their creation date (oldest first)
2. Assign sequential serial numbers starting from 1
3. Update the database with the new serial numbers

### Notes

- The script uses transactions to ensure all updates are atomic
- New workers created after running the migration will automatically get serial numbers via the auto-increment functionality
- If the script fails, you can safely run it again as it assigns numbers based on creation date order

## Copy Hebrew Names to English

The `copyHebrewNamesToEnglish.js` script copies Hebrew names to English name fields for all workers where English names are not set.

### When to use this script

This script should be run after deciding to switch from Hebrew names to English names in the UI. It ensures that all workers have English name data even if they only had Hebrew names set previously.

### Running the script

Execute the script using Node.js:

```bash
node scripts/copyHebrewNamesToEnglish.js
```

This will:

1. Find all workers who have Hebrew names but are missing English names
2. Copy the Hebrew name values to the corresponding English name fields
3. Update the database with the new English name values

### Notes

- The script only updates workers who need updates (those with empty English names)
- It leaves existing English names untouched
- The update is performed in a transaction to ensure consistency
- A summary of all updates is printed at the end of the script execution
