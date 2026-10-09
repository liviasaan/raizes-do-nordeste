
import { describe, test, expect } from "@jest/globals";
import request from "supertest";
import app from "../src/app";

describe("API Raízes do Nordeste", () => {
  test("GET / deve retornar status 200", async () => {
    const resposta = await request(app).get("/");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      mensagem: "API Raízes do Nordeste funcionando!",
    });
  });

  test("GET /api/raizes deve retornar a mensagem do projeto", async () => {
    const resposta = await request(app).get("/api/raizes");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      mensagem: "Raízes do Nordeste",
    });
  });

  test("GET /api-docs.json deve retornar a documentação OpenAPI", async () => {
    const resposta = await request(app).get("/api-docs.json");

    expect(resposta.status).toBe(200);
    expect(resposta.body.openapi).toBe("3.0.0");
  });

  test("GET em rota inexistente deve retornar 404", async () => {
    const resposta = await request(app).get("/rota-inexistente");

    expect(resposta.status).toBe(404);
    expect(resposta.body.error).toBe("ROTA_NAO_ENCONTRADA");
  });
});
