import { describe, test, expect, jest } from "@jest/globals";
import { Response } from "express";
import { AuthRequest } from "../src/middlewares/auth.middleware";
import { criarPedido } from "../src/controllers/pedido.controller";

function criarResposta() {
  const res: any = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

function criarRequisicao(
  usuarioIdAutenticado: number | null,
  perfil: string,
  usuarioIdPedido: number
) {
  return {
    body: {
      usuarioId: usuarioIdPedido,
      canalPedido: "APP",
      itens: [{ produtoId: 1, quantidade: 1 }],
    },
    usuario:
      usuarioIdAutenticado === null
        ? undefined
        : {
            id: usuarioIdAutenticado,
            email: "teste@exemplo.com",
            perfil,
          },
  } as unknown as AuthRequest;
}

describe("Segurança na criação de pedidos", () => {
  test("CLIENTE não pode criar pedido para outro usuário", async () => {
    const req = criarRequisicao(1, "CLIENTE", 2);
    const res = criarResposta();

    await criarPedido(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "ACESSO_USUARIO_NEGADO",
      })
    );
  });

  test("Usuário sem autenticação não pode criar pedido", async () => {
    const req = criarRequisicao(null, "CLIENTE", 1);
    const res = criarResposta();

    await criarPedido(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "NAO_AUTORIZADO",
      })
    );
  });

  test("ID de usuário inválido é rejeitado", async () => {
    const req = criarRequisicao(1, "CLIENTE", -5);
    const res = criarResposta();

    await criarPedido(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "USUARIO_ID_INVALIDO",
      })
    );
  });
});
