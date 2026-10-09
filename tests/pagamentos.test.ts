
import request from "supertest";
import app from "../src/app";
import { describe, test, expect } from "@jest/globals";

describe("Pagamentos - Raízes do Nordeste", () => {
  test("Deve impedir pagamento sem autenticação", async () => {
    const resposta = await request(app)
      .post("/api/pedidos/1/pagamento")
      .send({
        metodo: "PIX",
      });

    expect(resposta.status).toBe(401);
  });

  test("Deve impedir pagamento com token inválido", async () => {
    const resposta = await request(app)
      .post("/api/pedidos/1/pagamento")
      .set("Authorization", "Bearer token-invalido")
      .send({
        metodo: "PIX",
      });

    expect(resposta.status).toBe(401);
  });

  test("Deve impedir pagamento com Bearer vazio", async () => {
    const resposta = await request(app)
      .post("/api/pedidos/1/pagamento")
      .set("Authorization", "Bearer ")
      .send({
        metodo: "PIX",
      });

    expect(resposta.status).toBe(401);
  });

  test("Deve retornar 404 para rota inexistente de pagamento", async () => {
    const resposta = await request(app).get(
      "/api/pedidos/1/pagamento/rota-inexistente"
    );

    expect(resposta.status).toBe(404);
  });
});
