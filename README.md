# Agriculture Management System

A web application for managing agricultural operations, built with Next.js and Vercel Postgres.

## Features

- Client Management
- Worker Management
- Field Management
- Harvest Tracking
- RESTful API endpoints
- Modern UI with SCSS

## Tech Stack

- Next.js (App Router)
- Vercel Postgres
- Prisma ORM
- SASS for styling

## Prerequisites

- Node.js 18+ and npm
- Vercel account (for database)

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory and add:
   ```
   DATABASE_URL="your-vercel-postgres-url"
   ```

4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

1. Create a new project on Vercel
2. Connect your repository
3. Add your environment variables
4. Deploy!
