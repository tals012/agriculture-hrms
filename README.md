# Agriculture HRMS (Human Resource Management System)

A comprehensive web application for managing agricultural operations, workers, fields, and harvest tracking, built with Next.js and Vercel Postgres.

## Features

- **Organization Management**

  - Multi-organization support
  - Organization settings and preferences

- **Client Management**

  - Track client details, licenses, and contact information
  - Client status tracking
  - Connect clients with their fields and workers

- **Worker Management**

  - Comprehensive worker profiles with personal information
  - Document management (visas, passports, etc.)
  - Worker attendance tracking
  - Multiple language support

- **Field Management**

  - Connect fields to clients
  - Track field details and status

- **Harvest Tracking**

  - Species and harvest type management
  - Harvest entry recording

- **Attendance & Working Hours**

  - Schedule builder
  - Working hours tracking and approval
  - Attendance history

- **Group Management**

  - Create and manage worker groups
  - Group leader assignment

- **Salary Management**

  - Salary calculations based on attendance
  - Monthly submissions

- **Authentication & Security**

  - Role-based access control
  - Secure authentication

- **Documents & Templates**

  - Document generation
  - Digital form templates

- **Messaging**
  - SMS notifications

## Tech Stack

- **Frontend**

  - Next.js 15 (App Router)
  - React 19
  - SASS for styling
  - Material UI components
  - React Select, React Datepicker, and other UI libraries

- **Backend**

  - Next.js API routes
  - Prisma ORM
  - Vercel Postgres
  - PDF generation with pdf-lib and pdfme

- **Authentication**

  - jose for JWT tokens
  - bcryptjs for password hashing

- **Storage**
  - AWS S3 for document storage

## Project Structure

```
agriculture-hrms/
├── src/
│   ├── app/                   # Next.js app router structure
│   │   ├── (frontend)/        # Frontend routes
│   │   │   ├── (main)/        # Main application routes
│   │   │   │   ├── admin/     # Admin dashboard and features
│   │   │   │   ├── manager/   # Field manager routes
│   │   │   │   ├── worker/    # Worker portal
│   │   │   │   └── group-leader/ # Group leader portal
│   │   │   └── login/         # Authentication pages
│   │   ├── api/               # API endpoints
│   │   └── (backend)/         # Backend services
│   ├── components/            # Reusable UI components
│   ├── containers/            # Page containers
│   ├── lib/                   # Utility functions and services
│   ├── styles/                # Global styles and SASS files
│   ├── hooks/                 # Custom React hooks
│   ├── svgs/                  # SVG assets
│   └── middleware.js          # Next.js middleware (auth, etc.)
├── prisma/                    # Prisma ORM configuration
│   └── schema.prisma          # Database schema definition
├── public/                    # Static assets
└── scripts/                   # Utility scripts
```

## Prerequisites

- Node.js 18+ and npm/pnpm
- Vercel account (for database)
- AWS account (for S3 storage)

## Setup Instructions

1. Clone the repository

   ```bash
   git clone <repository-url>
   cd agriculture-hrms
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory and add:

   ```
   # Database connection
   DATABASE_URL_PRISMA_URL="your-vercel-postgres-pooling-url"
   DATABASE_URL_URL_NON_POOLING="your-vercel-postgres-direct-url"

   # AWS S3 for document storage
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="your-aws-region"
   AWS_S3_BUCKET="your-s3-bucket-name"

   # JWT Secret for authentication
   JWT_SECRET="your-jwt-secret"
   ```

4. Initialize the database:

   ```bash
   npx prisma migrate dev
   ```

5. Run the development server:

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client

## Deployment

1. Create a new project on Vercel
2. Connect your repository
3. Add your environment variables
4. Deploy!

## Role-Based Access

The system supports different user roles:

- **ADMIN**: Full system access
- **FIELD_MANAGER**: Manage fields, harvests, and workers
- **GROUP_LEADER**: Manage worker groups and attendance
- **WORKER**: Access personal information and attendance

## Data Model

The system uses a relational database with Prisma ORM, including models for:

- Organizations
- Users (with different roles)
- Clients
- Workers
- Fields
- Harvests
- Working schedules
- Attendance records
- Documents

## License

[Your License Here]
