
import request from "supertest";
import app from "../src/app";
import { describe, test, expect } from "@jest/globals";

describe("Produtos e Estoque - Raízes do Nordeste", () => {
  test("Deve impedir acesso aos produtos sem autenticação", async () => {
    const resposta = await request(app).post("/api/produtos").send({
      nome: "Cuscuz Nordestino",
      preco: 12.9,
      estoque: 10,
    });

    expect(resposta.status).toBe(401);
  });

  test("Deve impedir alteração de estoque sem autenticação", async () => {
    const resposta = await request(app)
      .patch("/api/produtos/1/estoque")
      .send({
        quantidade: 10,
      });

    expect(resposta.status).toBe(401);
  });

  test("Deve retornar 404 para uma rota inexistente de produtos", async () => {
    const resposta = await request(app).get(
      "/api/produtos/rota-que-nao-existe/teste"
    );

    expect(resposta.status).toBe(404);
  });
});
