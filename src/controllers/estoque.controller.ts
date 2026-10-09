import { Request, Response } from "express";
import prisma from "../database/db";

export async function movimentarEstoque(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { quantidade, tipo } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "ID_INVALIDO",
        message: "O ID do produto é inválido.",
      });
    }

    const quantidadeNumero = Number(quantidade);

    if (!Number.isInteger(quantidadeNumero) || quantidadeNumero <= 0) {
      return res.status(400).json({
        error: "QUANTIDADE_INVALIDA",
        message: "A quantidade deve ser um número inteiro maior que zero.",
      });
    }

    if (tipo !== "ENTRADA" && tipo !== "SAIDA") {
      return res.status(400).json({
        error: "TIPO_INVALIDO",
        message: "O tipo deve ser ENTRADA ou SAIDA.",
      });
    }

    const produto = await prisma.produto.findUnique({
      where: { id },
    });

    if (!produto) {
      return res.status(404).json({
        error: "PRODUTO_NAO_ENCONTRADO",
        message: "Produto não encontrado.",
      });
    }

    if (tipo === "SAIDA" && produto.estoque < quantidadeNumero) {
      return res.status(409).json({
        error: "ESTOQUE_INSUFICIENTE",
        message: "Não há estoque suficiente para realizar a operação.",
        estoqueDisponivel: produto.estoque,
        quantidadeSolicitada: quantidadeNumero,
      });
    }

    const novoEstoque =
      tipo === "ENTRADA"
        ? produto.estoque + quantidadeNumero
        : produto.estoque - quantidadeNumero;

    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: {
        estoque: novoEstoque,
      },
    });

    return res.status(200).json({
      message: "Estoque atualizado com sucesso.",
      tipo,
      quantidade: quantidadeNumero,
      produto: produtoAtualizado,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "ERRO_INTERNO",
      message: "Erro ao movimentar estoque.",
    });
  }
}