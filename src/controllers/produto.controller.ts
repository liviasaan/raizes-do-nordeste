
import { Request, Response } from "express";
import prisma from "../database/db";

// CADASTRAR PRODUTO
export async function cadastrarProduto(req: Request, res: Response) {
  try {
    const { nome, descricao, preco, estoque } = req.body;

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      preco === undefined ||
      estoque === undefined
    ) {
      return res.status(400).json({
        error: "DADOS_INVALIDOS",
        message: "Nome, preço e estoque são obrigatórios.",
      });
    }

    const precoNumero = Number(preco);
    const estoqueNumero = Number(estoque);

    if (!Number.isFinite(precoNumero) || precoNumero < 0) {
      return res.status(422).json({
        error: "PRECO_INVALIDO",
        message: "O preço deve ser um número válido e não negativo.",
      });
    }

    if (
      !Number.isInteger(estoqueNumero) ||
      estoqueNumero < 0
    ) {
      return res.status(422).json({
        error: "ESTOQUE_INVALIDO",
        message: "O estoque deve ser um número inteiro não negativo.",
      });
    }

    if (
      descricao !== undefined &&
      descricao !== null &&
      typeof descricao !== "string"
    ) {
      return res.status(422).json({
        error: "DESCRICAO_INVALIDA",
        message: "A descrição deve ser um texto.",
      });
    }

    const produto = await prisma.produto.create({
      data: {
        nome: nome.trim(),
        descricao: descricao ?? null,
        preco: precoNumero,
        estoque: estoqueNumero,
      },
    });

    return res.status(201).json({
      message: "Produto cadastrado com sucesso.",
      produto,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "ERRO_INTERNO",
      message: "Erro ao cadastrar produto.",
    });
  }
}

// LISTAR PRODUTOS ATIVOS
export async function listarProdutos(req: Request, res: Response) {
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json(produtos);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "ERRO_INTERNO",
      message: "Erro ao listar produtos.",
    });
  }
}

// BUSCAR PRODUTO POR ID
export async function buscarProduto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "ID_INVALIDO",
        message: "O ID do produto é inválido.",
      });
    }

    const produto = await prisma.produto.findFirst({
      where: {
        id,
        ativo: true,
      },
    });

    if (!produto) {
      return res.status(404).json({
        error: "PRODUTO_NAO_ENCONTRADO",
        message: "Produto não encontrado ou desativado.",
      });
    }

    return res.status(200).json(produto);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "ERRO_INTERNO",
      message: "Erro ao buscar produto.",
    });
  }
}

// ATUALIZAR PRODUTO
export async function atualizarProduto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { nome, descricao, preco, estoque } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "ID_INVALIDO",
        message: "O ID do produto é inválido.",
      });
    }

    const produtoExistente = await prisma.produto.findUnique({
      where: { id },
    });

    if (!produtoExistente) {
      return res.status(404).json({
        error: "PRODUTO_NAO_ENCONTRADO",
        message: "Produto não encontrado.",
      });
    }

    if (!produtoExistente.ativo) {
      return res.status(409).json({
        error: "PRODUTO_DESATIVADO",
        message: "Não é possível atualizar um produto desativado.",
      });
    }

    if (nome !== undefined) {
      if (typeof nome !== "string" || !nome.trim()) {
        return res.status(422).json({
          error: "NOME_INVALIDO",
          message: "O nome deve ser um texto não vazio.",
        });
      }
    }

    if (
      descricao !== undefined &&
      descricao !== null &&
      typeof descricao !== "string"
    ) {
      return res.status(422).json({
        error: "DESCRICAO_INVALIDA",
        message: "A descrição deve ser um texto.",
      });
    }

    if (preco !== undefined) {
      const precoNumero = Number(preco);

      if (!Number.isFinite(precoNumero) || precoNumero < 0) {
        return res.status(422).json({
          error: "PRECO_INVALIDO",
          message: "O preço deve ser um número válido e não negativo.",
        });
      }
    }

    if (estoque !== undefined) {
      const estoqueNumero = Number(estoque);

      if (
        !Number.isInteger(estoqueNumero) ||
        estoqueNumero < 0
      ) {
        return res.status(422).json({
          error: "ESTOQUE_INVALIDO",
          message: "O estoque deve ser um número inteiro não negativo.",
        });
      }
    }

    const produto = await prisma.produto.update({
      where: { id },
      data: {
        nome: nome !== undefined ? nome.trim() : undefined,
        descricao,
        preco: preco !== undefined ? Number(preco) : undefined,
        estoque: estoque !== undefined ? Number(estoque) : undefined,
      },
    });

    return res.status(200).json({
      message: "Produto atualizado com sucesso.",
      produto,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "ERRO_INTERNO",
      message: "Erro ao atualizar produto.",
    });
  }
}

// EXCLUIR PRODUTO (EXCLUSÃO LÓGICA)
export async function excluirProduto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "ID_INVALIDO",
        message: "O ID do produto é inválido.",
      });
    }

    const produtoExistente = await prisma.produto.findUnique({
      where: { id },
    });

    if (!produtoExistente) {
      return res.status(404).json({
        error: "PRODUTO_NAO_ENCONTRADO",
        message: "Produto não encontrado.",
      });
    }

    if (!produtoExistente.ativo) {
      return res.status(409).json({
        error: "PRODUTO_JA_DESATIVADO",
        message: "Este produto já está desativado.",
      });
    }

    const produto = await prisma.produto.update({
      where: { id },
      data: {
        ativo: false,
      },
    });

    return res.status(200).json({
      message: "Produto desativado com sucesso.",
      produto,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "ERRO_INTERNO",
      message: "Erro ao desativar produto.",
    });
  }
}
