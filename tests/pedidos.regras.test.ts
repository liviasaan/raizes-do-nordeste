
import request from "supertest";
import app from "../src/app";
import { describe, test, expect } from "@jest/globals";

describe("Regras de pedidos - Raízes do Nordeste", () => {
  const rota = "/api/pedidos";

  test("Deve exigir autenticação para criar pedido com desconto", async () => {
    const resposta = await request(app)
      .post(rota)
      .send({
        usuarioId: 1,
        canalPedido: "APP",
        pontosResgatados: 100,
        itens: [{ produtoId: 1, quantidade: 1 }],
      });

    expect(resposta.status).toBe(401);
  });

  test("Deve exigir autenticação para pedido com vários itens", async () => {
    const resposta = await request(app)
      .post(rota)
      .send({
        usuarioId: 1,
        canalPedido: "TOTEM",
        itens: [
          { produtoId: 1, quantidade: 2 },
          { produtoId: 2, quantidade: 1 },
        ],
      });

    expect(resposta.status).toBe(401);
  });

  test("Deve impedir consulta de pedido sem token", async () => {
    const resposta = await request(app)
      .patch("/api/pedidos/1/status")
      .send({ status: "FINALIZADO" });

    expect(resposta.status).toBe(401);
  });

  test("Deve rejeitar token inválido ao tentar resgatar pontos", async () => {
    const resposta = await request(app)
      .post(rota)
      .set("Authorization", "Bearer token-invalido")
      .send({
        usuarioId: 1,
        canalPedido: "WEB",
        pontosResgatados: 100,
        itens: [{ produtoId: 1, quantidade: 1 }],
      });

    expect(resposta.status).toBe(401);
  });
});
