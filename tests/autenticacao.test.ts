
import { describe, test, expect } from "@jest/globals";
import request from "supertest";
import app from "../src/app";

describe("Autenticação JWT - Raízes do Nordeste", () => {
  test("Deve bloquear acesso ao perfil sem token", async () => {
    const resposta = await request(app).get("/api/perfil");

    expect(resposta.status).toBe(401);
  });

  test("Deve bloquear acesso com token inválido", async () => {
    const resposta = await request(app)
      .get("/api/perfil")
      .set("Authorization", "Bearer token-invalido");

    expect(resposta.status).toBe(401);
  });

  test("Deve bloquear cadastro de produto sem autenticação", async () => {
    const resposta = await request(app)
      .post("/api/produtos")
      .send({
        nome: "Produto de teste",
        preco: 10,
        estoque: 5,
      });

    expect(resposta.status).toBe(401);
  });

  test("Deve bloquear movimentação de estoque sem autenticação", async () => {
    const resposta = await request(app)
      .patch("/api/produtos/1/estoque")
      .send({
        quantidade: 5,
        tipo: "ENTRADA",
      });

    expect(resposta.status).toBe(401);
  });

  test("Deve bloquear acesso ao perfil com Bearer vazio", async () => {
    const resposta = await request(app)
      .get("/api/perfil")
      .set("Authorization", "Bearer ");

    expect(resposta.status).toBe(401);
  });
});
