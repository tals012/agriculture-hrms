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
