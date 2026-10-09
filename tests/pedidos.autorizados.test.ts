import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { Response } from "express";
import { AuthRequest } from "../src/middlewares/auth.middleware";

const buscarUsuario = jest.fn<(...args: any[]) => Promise<any>>();
const buscarProdutos = jest.fn<(...args: any[]) => Promise<any>>();
const atualizarEstoque = jest.fn<(...args: any[]) => Promise<any>>();
const salvarPedido = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../src/database/db", () => ({
  __esModule: true,
  default: {
    usuario: {
      findUnique: buscarUsuario,
    },
    produto: {
      findMany: buscarProdutos,
    },
    $transaction: jest.fn(async (callback: any) =>
      callback({
        usuario: {
          updateMany: jest.fn(async () => ({ count: 1 })),
        },
        produto: {
          updateMany: atualizarEstoque,
        },
        pedido: {
          create: salvarPedido,
        },
      })
    ),
  },
}));

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
  usuarioAutenticadoId: number,
  perfil: string,
  usuarioIdPedido: number
) {
  return {
    usuario: {
      id: usuarioAutenticadoId,
      email: "teste@exemplo.com",
      perfil,
    },
    body: {
      usuarioId: usuarioIdPedido,
      canalPedido: "APP",
      itens: [{ produtoId: 1, quantidade: 2 }],
      pontosResgatados: 0,
    },
  } as unknown as AuthRequest;
}

describe("Criação autorizada de pedidos", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    buscarUsuario.mockResolvedValue({
      id: 1,
      ativo: true,
      participaFidelidade: true,
      pontosFidelidade: 500,
    });

    buscarProdutos.mockResolvedValue([
      {
        id: 1,
        nome: "Produto de teste",
        preco: 30,
        estoque: 20,
        ativo: true,
      },
    ]);

    atualizarEstoque.mockResolvedValue({ count: 1 });

    salvarPedido.mockResolvedValue({
      id: 100,
      usuarioId: 1,
      status: "PENDENTE",
      valorOriginal: 60,
      valorDesconto: 6,
      valorTotal: 54,
    });
  });

  test("CLIENTE pode criar pedido para si mesmo", async () => {
    const req = criarRequisicao(1, "CLIENTE", 1);
    const res = criarResposta();

    await criarPedido(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(salvarPedido).toHaveBeenCalledTimes(1);
  });

  test("ADMIN pode criar pedido para outro usuário", async () => {
    const req = criarRequisicao(2, "ADMIN", 1);
    const res = criarResposta();

    await criarPedido(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(salvarPedido).toHaveBeenCalledTimes(1);
  });

  test("GERENTE pode criar pedido para outro usuário", async () => {
    const req = criarRequisicao(2, "GERENTE", 1);
    const res = criarResposta();

    await criarPedido(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(salvarPedido).toHaveBeenCalledTimes(1);
  });

  test("Aplica promoção de 10% em pedido de R$ 60", async () => {
    const req = criarRequisicao(1, "CLIENTE", 1);
    const res = criarResposta();

    await criarPedido(req, res as Response);

    expect(salvarPedido).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          valorOriginal: 60,
          valorDesconto: 6,
          valorTotal: 54,
          promocao: "DESCONTO_10_ACIMA_50",
        }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("Atualiza o estoque ao criar pedido", async () => {
    const req = criarRequisicao(1, "CLIENTE", 1);
    const res = criarResposta();

    await criarPedido(req, res as Response);

    expect(atualizarEstoque).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 1,
          estoque: { gte: 2 },
        }),
        data: {
          estoque: { decrement: 2 },
        },
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
