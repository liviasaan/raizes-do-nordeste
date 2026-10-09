-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "promocao" TEXT,
ADD COLUMN     "valorDesconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valorOriginal" DECIMAL(10,2) NOT NULL DEFAULT 0;
