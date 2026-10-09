
import request from "supertest";
import app from "../src/app";
import { describe, test, expect } from "@jest/globals";

describe("Pedidos - Raízes do Nordeste", () => {
  test("Deve impedir criação de pedido sem autenticação", async () => {
    const resposta = await request(app)
      .post("/api/pedidos")
      .send({
        usuarioId: 1,
        canalPedido: "APP",
        itens: [
          {
            produtoId: 1,
            quantidade: 1,
          },
        ],
      });

    expect(resposta.status).toBe(401);
  });

  test("Deve impedir atualização de pedido sem autenticação", async () => {
    const resposta = await request(app)
      .patch("/api/pedidos/1/status")
      .send({
        status: "FINALIZADO",
      });

    expect(resposta.status).toBe(401);
  });

  test("Deve retornar 404 para rota inexistente de pedidos", async () => {
    const resposta = await request(app).get(
      "/api/pedidos/rota-inexistente/teste"
    );

    expect(resposta.status).toBe(404);
  });
});
