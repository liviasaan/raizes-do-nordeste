-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "consentimentoLgpd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dataConsentimento" TIMESTAMP(3);
