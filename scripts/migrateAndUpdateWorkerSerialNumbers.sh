#!/bin/bash

echo "Starting worker serial number migration and update..."

# Navigate to the project root (if needed)
# cd /path/to/your/project

# Run Prisma migration
echo "Running Prisma migration..."
npx prisma migrate dev --name add_worker_serial_number

# Check if migration was successful
if [ $? -ne 0 ]; then
  echo "Migration failed. Aborting."
  exit 1
fi

echo "Migration completed successfully."

# Run the serial number update script
echo "Running serial number update script..."
node scripts/updateWorkerSerialNumbers.js

echo "Process complete." 