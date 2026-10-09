import { describe, test, expect, afterAll } from "@jest/globals";
import prisma from "../src/database/db";

describe("Integração com PostgreSQL - Raízes do Nordeste", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("deve conectar ao banco de testes", async () => {
    const resultado = await prisma.$queryRaw<
      Array<{ nome: string }>
    >`SELECT current_database() AS nome`;

    expect(resultado[0].nome).toBe("raizes_do_nordeste_test");
  });

  test("deve consultar os usuários no PostgreSQL", async () => {
    const usuarios = await prisma.usuario.findMany();

    expect(Array.isArray(usuarios)).toBe(true);
  });

  test("deve consultar os produtos no PostgreSQL", async () => {
    const produtos = await prisma.produto.findMany();

    expect(Array.isArray(produtos)).toBe(true);
  });
});
