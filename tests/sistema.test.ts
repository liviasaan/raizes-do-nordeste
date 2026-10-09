import { describe, test, expect } from "@jest/globals";

describe("API Raízes do Nordeste", () => {
  test("deve executar o ambiente de testes", () => {
    expect(1 + 1).toBe(2);
  });

  test("deve reconhecer os canais de pedidos", () => {
    const canais = ["APP", "TOTEM", "BALCAO", "PICKUP", "WEB"];

    expect(canais).toContain("APP");
    expect(canais).toContain("TOTEM");
  });
});