import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { AuthRequest } from "../src/middlewares/auth.middleware";

const buscarPedido = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../src/database/db", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(async (callback: any) =>
      callback({
        pedido: {
          findUnique: buscarPedido,
          updateMany: jest.fn(async () => ({ count: 1 })),
        },
        pagamento: {
          create: jest.fn(async () => ({
            id: 1,
            status: "APROVADO",
          })),
        },
      })
    ),
  },
}));

import { processarPagamento } from "../src/controllers/pagamento.controller";
import { permitirPerfis } from "../src/middlewares/permissao.middleware";

function criarResposta() {
  const resposta: any = {
    status: jest.fn(),
    json: jest.fn(),
  };

  resposta.status.mockReturnValue(resposta);
  resposta.json.mockReturnValue(resposta);

  return resposta;
}

function criarRequisicao(
  usuarioId: number,
  perfil: string,
  pedidoId = 10
) {
  return {
    params: { id: String(pedidoId) },
    body: { metodo: "PIX" },
    usuario: {
      id: usuarioId,
      email: "teste@exemplo.com",
      perfil,
    },
  } as unknown as AuthRequest;
}

describe("Segurança de pagamentos", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    buscarPedido.mockResolvedValue({
      id: 10,
      usuarioId: 1,
      status: "PENDENTE",
      pagamento: null,
      usuario: { participaFidelidade: false },
      itens: [],
      pontosResgatados: 0,
      valorTotal: 50,
    });
  });

  test("CLIENTE não pode pagar pedido de outro usuário", async () => {
    const req = criarRequisicao(2, "CLIENTE");
    const res = criarResposta();

    await processarPagamento(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "ACESSO_PEDIDO_NEGADO",
      })
    );
  });

  test("GERENTE pode acessar pagamento de outro usuário", async () => {
    const req = criarRequisicao(2, "GERENTE");
    const res = criarResposta();

    await processarPagamento(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("ADMIN pode acessar pagamento de outro usuário", async () => {
    const req = criarRequisicao(2, "ADMIN");
    const res = criarResposta();

    await processarPagamento(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("CLIENTE pode acessar pagamento do próprio pedido", async () => {
    const req = criarRequisicao(1, "CLIENTE");
    const res = criarResposta();

    await processarPagamento(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("CLIENTE não pode alterar status de pedidos", () => {
    const req = criarRequisicao(1, "CLIENTE");
    const res = criarResposta();
    const next = jest.fn();

    permitirPerfis("ADMIN", "GERENTE")(
      req,
      res as Response,
      next
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("ADMIN pode passar pela verificação de perfil", () => {
    const req = criarRequisicao(1, "ADMIN");
    const res = criarResposta();
    const next = jest.fn();

    permitirPerfis("ADMIN", "GERENTE")(
      req,
      res as Response,
      next
    );

    expect(next).toHaveBeenCalled();
  });
});


