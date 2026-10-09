import { describe, test, expect } from "@jest/globals";
import swaggerSpec from "../src/config/swagger";

const spec = swaggerSpec as any;

describe("Documentação Swagger - Raízes do Nordeste", () => {
  test("Deve utilizar OpenAPI 3", () => {
    expect(spec.openapi).toBe("3.0.0");
  });

  test("Deve configurar autenticação JWT", () => {
    expect(spec.components.securitySchemes.bearerAuth).toEqual(
      expect.objectContaining({
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      })
    );
  });

  test("Deve documentar as principais rotas", () => {
    const rotas = [
      "/api/usuarios",
      "/api/login",
      "/api/perfil",
      "/api/produtos",
      "/api/produtos/{id}/estoque",
      "/api/pedidos",
      "/api/pedidos/{id}/status",
      "/api/pedidos/{id}/pagamento",
    ];

    for (const rota of rotas) {
      expect(spec.paths).toHaveProperty(rota);
    }
  });

  test("Deve exigir JWT nas operações protegidas", () => {
    const operacoes = [
      spec.paths["/api/perfil"].get,
      spec.paths["/api/produtos"].post,
      spec.paths["/api/produtos/{id}/estoque"].patch,
      spec.paths["/api/pedidos"].post,
      spec.paths["/api/pedidos/{id}/status"].patch,
      spec.paths["/api/pedidos/{id}/pagamento"].post,
    ];

    for (const operacao of operacoes) {
      expect(operacao.security).toEqual([
        { bearerAuth: [] },
      ]);
    }
  });

  test("Deve documentar os campos obrigatórios do estoque", () => {
    const schema = spec.components.schemas.MovimentacaoEstoque;

    expect(schema.required).toEqual(
      expect.arrayContaining(["quantidade", "tipo"])
    );

    expect(schema.properties.quantidade.minimum).toBe(1);

    expect(schema.properties.tipo.enum).toEqual([
      "ENTRADA",
      "SAIDA",
    ]);
  });

  test("Deve documentar o erro de estoque insuficiente", () => {
    const operacao =
      spec.paths["/api/produtos/{id}/estoque"].patch;

    expect(operacao.responses["409"]).toBeDefined();
  });

  test("Deve documentar acesso negado em rotas administrativas", () => {
    const operacoes = [
      spec.paths["/api/produtos"].post,
      spec.paths["/api/produtos/{id}"].put,
      spec.paths["/api/produtos/{id}"].delete,
      spec.paths["/api/produtos/{id}/estoque"].patch,
      spec.paths["/api/pedidos/{id}/status"].patch,
    ];

    for (const operacao of operacoes) {
      expect(operacao.responses["403"]).toBeDefined();
    }
  });
});
