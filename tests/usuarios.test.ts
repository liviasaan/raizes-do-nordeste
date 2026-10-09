import request from "supertest";
import app from "../src/app";
import { describe, test, expect } from "@jest/globals";

describe("Usuários - Raízes do Nordeste", () => {
  test("Deve impedir acesso ao perfil sem token", async () => {
    const resposta = await request(app).get("/api/perfil");

    expect(resposta.status).toBe(401);
  });

  test("Deve impedir acesso com token inválido", async () => {
    const resposta = await request(app)
      .get("/api/perfil")
      .set("Authorization", "Bearer token-invalido");

    expect(resposta.status).toBe(401);
  });

  test("Deve impedir acesso com Bearer vazio", async () => {
    const resposta = await request(app)
      .get("/api/perfil")
      .set("Authorization", "Bearer ");

    expect(resposta.status).toBe(401);
  });

  test("Deve impedir login sem informar credenciais", async () => {
    const resposta = await request(app)
      .post("/api/login")
      .send({});

    expect([400, 401, 422]).toContain(resposta.status);
  });

  test("Deve impedir login com senha incorreta", async () => {
    const resposta = await request(app)
      .post("/api/login")
      .send({
        email: "maria@teste.com",
        senha: "senha-incorreta",
      });

    expect([400, 401, 422]).toContain(resposta.status);
  });
});