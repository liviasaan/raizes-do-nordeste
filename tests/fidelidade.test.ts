
import request from "supertest";
import app from "../src/app";
import { describe, test, expect } from "@jest/globals";

describe("Fidelidade - Raízes do Nordeste", () => {
  const rota = "/api/usuarios/me/fidelidade";

  test("Deve impedir alteração sem autenticação", async () => {
    const resposta = await request(app)
      .patch(rota)
      .send({ participaFidelidade: true });

    expect(resposta.status).toBe(401);
  });

  test("Deve rejeitar token inválido", async () => {
    const resposta = await request(app)
      .patch(rota)
      .set("Authorization", "Bearer token-invalido")
      .send({ participaFidelidade: true });

    expect(resposta.status).toBe(401);
  });

  test("Deve rejeitar Bearer vazio", async () => {
    const resposta = await request(app)
      .patch(rota)
      .set("Authorization", "Bearer ")
      .send({ participaFidelidade: true });

    expect(resposta.status).toBe(401);
  });

  test("Deve retornar 404 para rota inexistente", async () => {
    const resposta = await request(app).get(
      "/api/usuarios/me/fidelidade/rota-inexistente"
    );

    expect(resposta.status).toBe(404);
  });
});
