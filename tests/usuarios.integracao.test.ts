import { describe, test, expect, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/database/db";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

describe("Integração de usuários com PostgreSQL", () => {
  const emailTeste = `integracao-${randomUUID()}@teste.com`;

  afterAll(async () => {
    await prisma.usuario.deleteMany({
      where: { email: emailTeste },
    });

    await prisma.$disconnect();
  });

  test("deve cadastrar um usuário no banco de testes", async () => {
    const resposta = await request(app)
      .post("/api/usuarios")
      .send({
        nome: "Usuário de Integração",
        email: emailTeste,
        senha: "SenhaTeste123",
        consentimentoLgpd: true,
        participaFidelidade: true,
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario.email).toBe(emailTeste);

    const usuario = await prisma.usuario.findUnique({
      where: { email: emailTeste },
    });

    expect(usuario).not.toBeNull();
    expect(usuario?.nome).toBe("Usuário de Integração");
    expect(usuario?.participaFidelidade).toBe(true);
    expect(usuario?.consentimentoLgpd).toBe(true);
    expect(usuario?.pontosFidelidade).toBe(0);

    const senhaValida = await bcrypt.compare(
      "SenhaTeste123",
      usuario!.senha
    );

    expect(senhaValida).toBe(true);
    expect(usuario?.senha).not.toBe("SenhaTeste123");
  });
});

