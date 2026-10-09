import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { Response } from "express";
import { AuthRequest } from "../src/middlewares/auth.middleware";

const buscarUsuario = jest.fn<(...args: any[]) => Promise<any>>();
const atualizarUsuario = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../src/database/db", () => ({
  __esModule: true,
  default: {
    usuario: {
      findUnique: buscarUsuario,
      update: atualizarUsuario,
    },
  },
}));

import {
  desativarMinhaConta,
  atualizarParticipacaoFidelidade,
} from "../src/controllers/usuario.controller";

function criarResposta() {
  const res: any = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

function criarRequisicao(body: Record<string, unknown> = {}) {
  return {
    usuario: {
      id: 1,
      email: "cliente@exemplo.com",
      perfil: "CLIENTE",
    },
    body,
    originalUrl: "/api/usuarios/me",
  } as unknown as AuthRequest;
}

describe("Segurança da conta e fidelidade", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    buscarUsuario.mockResolvedValue({
      id: 1,
      nome: "Cliente",
      ativo: true,
      participaFidelidade: true,
      pontosFidelidade: 500,
    });

    atualizarUsuario.mockResolvedValue({
      id: 1,
      ativo: false,
      participaFidelidade: false,
      pontosFidelidade: 500,
    });
  });

  test("Desativação ignora ID de outro usuário no body", async () => {
    const req = criarRequisicao({ usuarioId: 999 });
    const res = criarResposta();

    await desativarMinhaConta(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(atualizarUsuario).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { ativo: false },
      })
    );
  });

  test("Fidelidade ignora ID de outro usuário no body", async () => {
    const req = criarRequisicao({
      usuarioId: 999,
      participaFidelidade: false,
    });
    const res = criarResposta();

    await atualizarParticipacaoFidelidade(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(atualizarUsuario).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { participaFidelidade: false },
      })
    );
  });

  test("Fidelidade rejeita valor inválido", async () => {
    const req = criarRequisicao({
      participaFidelidade: "sim",
    });
    const res = criarResposta();

    await atualizarParticipacaoFidelidade(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(atualizarUsuario).not.toHaveBeenCalled();
  });

  test("Conta inativa não pode alterar fidelidade", async () => {
    buscarUsuario.mockResolvedValue({
      id: 1,
      ativo: false,
    });

    const req = criarRequisicao({
      participaFidelidade: true,
    });
    const res = criarResposta();

    await atualizarParticipacaoFidelidade(req, res as Response);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(atualizarUsuario).not.toHaveBeenCalled();
  });
});
