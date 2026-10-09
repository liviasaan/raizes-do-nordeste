import { AuthRequest } from "../middlewares/auth.middleware";
import { Request, Response } from "express";
import prisma from "../database/db";

const canaisPermitidos = [
  "APP",
  "TOTEM",
  "BALCAO",
  "PICKUP",
  "WEB",
];

const statusPermitidos = [
  "PENDENTE",
  "EM_PREPARO",
  "PRONTO",
  "FINALIZADO",
  "CANCELADO",
];

// CRIAR PEDIDO
export async function criarPedido(req: AuthRequest, res: Response) {
  try {
    const {
      usuarioId,
      canalPedido,
      itens,
      pontosResgatados = 0,
    } = req.body ?? {};

    if (
      usuarioId === undefined ||
      !canalPedido ||
      itens === undefined
    ) {
      return res.status(400).json({
        error: "DADOS_OBRIGATORIOS",
        message:
          "usuarioId, canalPedido e itens são obrigatórios.",
      });
    }

    const idUsuario = Number(usuarioId);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(422).json({
        error: "USUARIO_ID_INVALIDO",
        message: "O ID do usuário é inválido.",
      });
    }
    // SEGURANCA: impedir pedidos em nome de outros clientes
    const usuarioAutenticado = req.usuario;

    if (!usuarioAutenticado) {
      return res.status(401).json({
        error: "NAO_AUTORIZADO",
        message: "Usuario nao autenticado.",
      });
    }

    const perfilAdministrativo =
      usuarioAutenticado.perfil === "ADMIN" ||
      usuarioAutenticado.perfil === "GERENTE";

    if (
      !perfilAdministrativo &&
      usuarioAutenticado.id !== idUsuario
    ) {
      return res.status(403).json({
        error: "ACESSO_USUARIO_NEGADO",
        message: "Voce nao pode criar pedidos para outros usuarios.",
      });
    }


    if (!canaisPermitidos.includes(canalPedido)) {
      return res.status(422).json({
        error: "CANAL_PEDIDO_INVALIDO",
        message: "Canal do pedido inválido.",
        details: { canaisPermitidos },
      });
    }

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(422).json({
        error: "ITENS_INVALIDOS",
        message:
          "O pedido deve possuir pelo menos um item.",
      });
    }

    if (
      typeof pontosResgatados !== "number" ||
      !Number.isInteger(pontosResgatados) ||
      pontosResgatados < 0 ||
      pontosResgatados % 100 !== 0
    ) {
      return res.status(422).json({
        error: "PONTOS_INVALIDOS",
        message:
          "Os pontos resgatados devem ser múltiplos de 100.",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: idUsuario },
    });

    if (!usuario) {
      return res.status(404).json({
        error: "USUARIO_NAO_ENCONTRADO",
        message: "Usuário não encontrado.",
      });
    }

    if (!usuario.ativo) {
      return res.status(403).json({
        error: "USUARIO_INATIVO",
        message:
          "Usuário inativo não pode realizar pedidos.",
      });
    }

    if (
      pontosResgatados > 0 &&
      !usuario.participaFidelidade
    ) {
      return res.status(403).json({
        error: "FIDELIDADE_INATIVA",
        message:
          "O usuário não participa do programa de fidelidade.",
      });
    }

    if (pontosResgatados > usuario.pontosFidelidade) {
      return res.status(409).json({
        error: "SALDO_INSUFICIENTE",
        message:
          "O usuário não possui pontos suficientes.",
      });
    }

    const quantidadesPorProduto = new Map<number, number>();

    for (const item of itens) {
      if (
        !item ||
        typeof item !== "object" ||
        item.produtoId === undefined ||
        item.quantidade === undefined
      ) {
        return res.status(422).json({
          error: "ITEM_INVALIDO",
          message:
            "Cada item deve informar produtoId e quantidade.",
        });
      }

      const produtoId = Number(item.produtoId);
      const quantidade = Number(item.quantidade);

      if (
        !Number.isInteger(produtoId) ||
        produtoId <= 0 ||
        !Number.isInteger(quantidade) ||
        quantidade <= 0
      ) {
        return res.status(422).json({
          error: "ITEM_INVALIDO",
          message:
            "Informe produtoId válido e quantidade maior que zero.",
        });
      }

      quantidadesPorProduto.set(
        produtoId,
        (quantidadesPorProduto.get(produtoId) || 0) +
          quantidade
      );
    }

    const idsProdutos = [...quantidadesPorProduto.keys()];

    const produtos = await prisma.produto.findMany({
      where: {
        id: { in: idsProdutos },
      },
    });

    if (produtos.length !== idsProdutos.length) {
      return res.status(404).json({
        error: "PRODUTO_NAO_ENCONTRADO",
        message:
          "Um ou mais produtos não foram encontrados.",
      });
    }

    for (const [produtoId, quantidade] of quantidadesPorProduto) {
      const produto = produtos.find(
        (p) => p.id === produtoId
      );

      if (!produto) {
        return res.status(404).json({
          error: "PRODUTO_NAO_ENCONTRADO",
          message: `Produto ${produtoId} não encontrado.`,
        });
      }

      if (!produto.ativo) {
        return res.status(409).json({
          error: "PRODUTO_INATIVO",
          message:
            `O produto ${produto.nome} está inativo.`,
        });
      }

      if (produto.estoque < quantidade) {
        return res.status(409).json({
          error: "ESTOQUE_INSUFICIENTE",
          message:
            `Estoque insuficiente para ${produto.nome}.`,
          details: {
            produtoId,
            estoqueDisponivel: produto.estoque,
            quantidadeSolicitada: quantidade,
          },
        });
      }
    }

    // CALCULAR VALOR ORIGINAL
    let valorOriginal = 0;

    for (const [produtoId, quantidade] of quantidadesPorProduto) {
      const produto = produtos.find(
        (p) => p.id === produtoId
      );

      if (produto) {
        valorOriginal +=
          Number(produto.preco) * quantidade;
      }
    }

    valorOriginal = Number(valorOriginal.toFixed(2));

    // PROMOÇÃO DE 10%
    let descontoPromocao = 0;
    let promocao: string | null = null;

    if (valorOriginal >= 50) {
      descontoPromocao = Number(
        (valorOriginal * 0.1).toFixed(2)
      );

      promocao = "DESCONTO_10_ACIMA_50";
    }

    // DESCONTO DE FIDELIDADE
    const descontoFidelidade =
      (pontosResgatados / 100) * 5;

    const valorAposPromocao =
      valorOriginal - descontoPromocao;

    if (descontoFidelidade > valorAposPromocao) {
      return res.status(422).json({
        error: "DESCONTO_EXCEDE_PEDIDO",
        message:
          "O desconto de fidelidade não pode ultrapassar o valor do pedido.",
      });
    }

    const valorDesconto = Number(
      (descontoPromocao + descontoFidelidade).toFixed(2)
    );

    const valorTotal = Number(
      (valorOriginal - valorDesconto).toFixed(2)
    );

    // TRANSAÇÃO: PONTOS, ESTOQUE E PEDIDO
    const resultado = await prisma.$transaction(
      async (tx) => {
        if (pontosResgatados > 0) {
          const atualizacaoPontos =
            await tx.usuario.updateMany({
              where: {
                id: idUsuario,
                ativo: true,
                participaFidelidade: true,
                pontosFidelidade: {
                  gte: pontosResgatados,
                },
              },
              data: {
                pontosFidelidade: {
                  decrement: pontosResgatados,
                },
              },
            });

          if (atualizacaoPontos.count !== 1) {
            throw new Error("PONTOS_INDISPONIVEIS");
          }
        }

        for (const [
          produtoId,
          quantidade,
        ] of quantidadesPorProduto) {
          const atualizacao =
            await tx.produto.updateMany({
              where: {
                id: produtoId,
                ativo: true,
                estoque: {
                  gte: quantidade,
                },
              },
              data: {
                estoque: {
                  decrement: quantidade,
                },
              },
            });

          if (atualizacao.count !== 1) {
            throw new Error(
              `ESTOQUE_INDISPONIVEL:${produtoId}`
            );
          }
        }

        const novoPedido = await tx.pedido.create({
          data: {
            usuarioId: idUsuario,
            canalPedido,
            valorOriginal,
            valorDesconto,
            valorTotal,
            promocao,
            pontosResgatados,
            status: "PENDENTE",
            itens: {
              create: [
                ...quantidadesPorProduto.entries(),
              ].map(([produtoId, quantidade]) => {
                const produto = produtos.find(
                  (p) => p.id === produtoId
                );

                if (!produto) {
                  throw new Error(
                    "PRODUTO_NAO_ENCONTRADO"
                  );
                }

                return {
                  produtoId,
                  quantidade,
                  precoUnitario: produto.preco,
                };
              }),
            },
          },
          include: {
            itens: {
              include: {
                produto: true,
              },
            },
          },
        });

        return novoPedido;
      }
    );

    return res.status(201).json({
      message: "Pedido criado com sucesso.",
      pedido: resultado,
      descontos: {
        promocao: descontoPromocao,
        fidelidade: descontoFidelidade,
        total: valorDesconto,
      },
      pontosResgatados,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("ESTOQUE_INDISPONIVEL:")
    ) {
      return res.status(409).json({
        error: "ESTOQUE_INSUFICIENTE",
        message:
          "O estoque mudou durante a compra. Tente novamente.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "PONTOS_INDISPONIVEIS"
    ) {
      return res.status(409).json({
        error: "PONTOS_INSUFICIENTES",
        message:
          "O saldo de pontos mudou ou a fidelidade foi desativada.",
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "ERRO_INTERNO",
      message: "Erro ao processar pedido.",
    });
  }
}

// ATUALIZAR STATUS DO PEDIDO
export async function atualizarStatusPedido(
  req: Request,
  res: Response
) {
  try {
    const pedidoId = Number(req.params.id);
    const { status } = req.body ?? {};

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return res.status(400).json({
        error: "ID_INVALIDO",
        message: "O ID do pedido é inválido.",
      });
    }

    if (!status) {
      return res.status(400).json({
        error: "STATUS_OBRIGATORIO",
        message: "O status é obrigatório.",
      });
    }

    if (!statusPermitidos.includes(status)) {
      return res.status(422).json({
        error: "STATUS_INVALIDO",
        message: "Status do pedido inválido.",
        details: { statusPermitidos },
      });
    }

    const pedidoExistente = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        pagamento: true,
      },
    });

    if (!pedidoExistente) {
      return res.status(404).json({
        error: "PEDIDO_NAO_ENCONTRADO",
        message: "Pedido não encontrado.",
      });
    }

    if (
      pedidoExistente.status === "FINALIZADO" ||
      pedidoExistente.status === "CANCELADO"
    ) {
      return res.status(409).json({
        error: "PEDIDO_ENCERRADO",
        message:
          "Não é possível alterar um pedido finalizado ou cancelado.",
      });
    }

    if (
      status === "FINALIZADO" &&
      pedidoExistente.pagamento?.status !== "APROVADO"
    ) {
      return res.status(409).json({
        error: "PAGAMENTO_NAO_APROVADO",
        message:
          "O pedido só pode ser finalizado após a aprovação do pagamento.",
      });
    }

    // CANCELAMENTO COM DEVOLUÇÃO DE PONTOS E ESTOQUE
    if (status === "CANCELADO") {
      const resultado = await prisma.$transaction(
        async (tx) => {
          // Bloqueia a alteração de pedidos já encerrados.
          const alteracao = await tx.pedido.updateMany({
            where: {
              id: pedidoId,
              status: {
                notIn: ["FINALIZADO", "CANCELADO"],
              },
            },
            data: {
              status: "CANCELADO",
            },
          });

          if (alteracao.count !== 1) {
            throw new Error("PEDIDO_JA_ENCERRADO");
          }

          // Consulta os dados depois de bloquear a alteração.
          const pedido = await tx.pedido.findUniqueOrThrow({
            where: { id: pedidoId },
            include: {
              pagamento: true,
              itens: true,
            },
          });

          // Um pagamento aprovado exige processo de estorno.
          // Não podemos devolver apenas os pontos e estoque.
          if (pedido.pagamento?.status === "APROVADO") {
            throw new Error("PAGAMENTO_APROVADO");
          }

          // Evita devolver duas vezes em pedidos com
          // pagamento recusado e já registrado.
          if (pedido.pagamento?.status === "RECUSADO") {
            throw new Error("PAGAMENTO_RECUSADO");
          }

          // Devolve os pontos utilizados no pedido.
          if (pedido.pontosResgatados > 0) {
            await tx.usuario.update({
              where: {
                id: pedido.usuarioId,
              },
              data: {
                pontosFidelidade: {
                  increment: pedido.pontosResgatados,
                },
              },
            });
          }

          // Devolve as quantidades ao estoque.
          for (const item of pedido.itens) {
            await tx.produto.update({
              where: {
                id: item.produtoId,
              },
              data: {
                estoque: {
                  increment: item.quantidade,
                },
              },
            });
          }

          return tx.pedido.findUniqueOrThrow({
            where: { id: pedidoId },
            include: {
              itens: {
                include: {
                  produto: true,
                },
              },
            },
          });
        }
      );

      return res.status(200).json({
        message:
          "Pedido cancelado. Pontos devolvidos e estoque atualizado.",
        pedido: resultado,
        pontosDevolvidos: resultado.pontosResgatados,
      });
    }

    // ATUALIZAÇÃO DOS DEMAIS STATUS
    const resultado = await prisma.$transaction(
      async (tx) => {
        const alteracao = await tx.pedido.updateMany({
          where: {
            id: pedidoId,
            status: {
              notIn: ["FINALIZADO", "CANCELADO"],
            },
          },
          data: {
            status,
          },
        });

        if (alteracao.count !== 1) {
          throw new Error("PEDIDO_JA_ENCERRADO");
        }

        const pedidoAtualizado =
          await tx.pedido.findUniqueOrThrow({
            where: { id: pedidoId },
            include: {
              itens: {
                include: {
                  produto: true,
                },
              },
            },
          });

        return pedidoAtualizado;
      }
    );

    return res.status(200).json({
      message:
        status === "FINALIZADO"
          ? "Pedido finalizado com sucesso."
          : "Status do pedido atualizado com sucesso.",
      pedido: resultado,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PEDIDO_JA_ENCERRADO"
    ) {
      return res.status(409).json({
        error: "PEDIDO_JA_ENCERRADO",
        message:
          "Este pedido já foi finalizado ou cancelado.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "PAGAMENTO_APROVADO"
    ) {
      return res.status(409).json({
        error: "PAGAMENTO_APROVADO",
        message:
          "Não é possível cancelar um pedido com pagamento aprovado sem realizar um estorno.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "PAGAMENTO_RECUSADO"
    ) {
      return res.status(409).json({
        error: "PAGAMENTO_RECUSADO",
        message:
          "Este pagamento foi recusado. Verifique o estado do pedido.",
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "ERRO_INTERNO",
      message: "Erro ao atualizar status do pedido.",
    });
  }
}
