-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('PDF', 'IMAGE', 'DIGITAL_FORM_PDF_TEMPLATE_JSON', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('NOT_READY', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "ForeignWorkerDocumentType" AS ENUM ('UPLOADED', 'SIGNED', 'REMOTE_DOCUMENT');

-- CreateEnum
CREATE TYPE "AuthMode" AS ENUM ('PHONE_OTP', 'NONE', 'EMAIL_OTP', 'PASSWORD');

-- CreateEnum
CREATE TYPE "GeneralStatus" AS ENUM ('PENDING', 'COMPLETED', 'INITIALIZED', 'FAILED', 'NOT_INITIALIZED');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "thumbnailFilePath" TEXT,
    "type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'NOT_READY',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "note" TEXT,
    "type" "ForeignWorkerDocumentType" NOT NULL,
    "slug" TEXT,
    "authMode" "AuthMode" DEFAULT 'NONE',
    "isRemoteDocRead" BOOLEAN DEFAULT false,
    "isRemoteDocSubmitted" BOOLEAN DEFAULT false,
    "remoteDocInitiatedAt" TIMESTAMP(3),
    "remoteDocReadAt" TIMESTAMP(3),
    "remoteDocSmsStatus" "GeneralStatus" DEFAULT 'PENDING',
    "remoteDocSmsStatusAt" TIMESTAMP(3),
    "remoteDocSubmittedAt" TIMESTAMP(3),
    "isRemoteDocPasswordProtected" BOOLEAN DEFAULT false,
    "remoteDocPassword" TEXT,
    "workerId" TEXT NOT NULL,
    "documentAssetId" TEXT NOT NULL,
    "documentCategoryId" TEXT,
    "simpleCategoryId" TEXT,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerSimpleCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerSimpleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentCategoryWorker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCategoryWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerDigitalFormTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "documentCategoryId" TEXT,
    "templateAssetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerDigitalFormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkerDocument_documentAssetId_key" ON "WorkerDocument"("documentAssetId");

-- CreateIndex
CREATE INDEX "WorkerDocument_workerId_idx" ON "WorkerDocument"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerDigitalFormTemplate_templateAssetId_key" ON "WorkerDigitalFormTemplate"("templateAssetId");

-- AddForeignKey
ALTER TABLE "WorkerDocument" ADD CONSTRAINT "WorkerDocument_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDocument" ADD CONSTRAINT "WorkerDocument_documentAssetId_fkey" FOREIGN KEY ("documentAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDocument" ADD CONSTRAINT "WorkerDocument_documentCategoryId_fkey" FOREIGN KEY ("documentCategoryId") REFERENCES "DocumentCategoryWorker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDocument" ADD CONSTRAINT "WorkerDocument_simpleCategoryId_fkey" FOREIGN KEY ("simpleCategoryId") REFERENCES "WorkerSimpleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDocument" ADD CONSTRAINT "WorkerDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDigitalFormTemplate" ADD CONSTRAINT "WorkerDigitalFormTemplate_documentCategoryId_fkey" FOREIGN KEY ("documentCategoryId") REFERENCES "DocumentCategoryWorker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDigitalFormTemplate" ADD CONSTRAINT "WorkerDigitalFormTemplate_templateAssetId_fkey" FOREIGN KEY ("templateAssetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
