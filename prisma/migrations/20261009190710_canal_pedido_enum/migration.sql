/*
  Warnings:

  - Changed the type of `canalPedido` on the `Pedido` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CanalPedido" AS ENUM ('APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB');

-- AlterTable
ALTER TABLE "Pedido" ALTER COLUMN "canalPedido" TYPE "CanalPedido" USING "canalPedido"::"CanalPedido";
