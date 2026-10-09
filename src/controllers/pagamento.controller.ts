import { AuthRequest } from "../middlewares/auth.middleware";
import { Request, Response } from "express";
import prisma from "../database/db";
import { Prisma } from "@prisma/client";

export async function processarPagamento(
  req: AuthRequest,
  res: Response
) {
  try {
    const pedidoId = Number(req.params.id);
    const { metodo, codigoMock } = req.body ?? {};

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return res.status(400).json({
        error: "PEDIDO_ID_INVALIDO",
        message: "O ID do pedido é inválido.",
      });
    }

    const metodosPermitidos = [
      "PIX",
      "CARTAO",
      "DINHEIRO",
    ];

    if (typeof metodo !== "string") {
      return res.status(400).json({
        error: "METODO_OBRIGATORIO",
        message: "Informe o método de pagamento.",
      });
    }

    const metodoNormalizado = metodo.trim().toUpperCase();

    if (!metodosPermitidos.includes(metodoNormalizado)) {
      return res.status(422).json({
        error: "METODO_PAGAMENTO_INVALIDO",
        message: "Método de pagamento inválido.",
        details: { metodosPermitidos },
      });
    }

    if (
      codigoMock !== undefined &&
      codigoMock !== "RECUSAR"
    ) {
      return res.status(422).json({
        error: "CODIGO_MOCK_INVALIDO",
        message: "Use RECUSAR para simular uma recusa.",
      });
    }

    const resultado = await prisma.$transaction(
      async (tx) => {
        const pedido = await tx.pedido.findUnique({
          where: { id: pedidoId },
          include: {
            pagamento: true,
            usuario: true,
            itens: true,
          },
        });

        if (!pedido) {
          return {
            httpStatus: 404,
            body: {
              error: "PEDIDO_NAO_ENCONTRADO",
              message: "Pedido não encontrado.",
            },
          };
        }

                // SEGURANCA: verificar proprietario do pedido
        const usuarioAutenticado = req.usuario;

        if (!usuarioAutenticado) {
          return {
            httpStatus: 401,
            body: {
              error: "NAO_AUTORIZADO",
              message: "Usuario nao autenticado.",
            },
          };
        }

        const perfilAdministrativo =
          usuarioAutenticado.perfil === "ADMIN" ||
          usuarioAutenticado.perfil === "GERENTE";

        if (
          !perfilAdministrativo &&
          pedido.usuarioId !== usuarioAutenticado.id
        ) {
          return {
            httpStatus: 403,
            body: {
              error: "ACESSO_PEDIDO_NEGADO",
              message: "Voce nao pode pagar pedidos de outros usuarios.",
            },
          };
        }

        if (
          pedido.status === "CANCELADO" ||
          pedido.status === "FINALIZADO"
        ) {
          return {
            httpStatus: 409,
            body: {
              error: "PEDIDO_ENCERRADO",
              message:
                "Não é possível pagar um pedido encerrado.",
            },
          };
        }

        if (pedido.pagamento) {
          return {
            httpStatus: 409,
            body: {
              error: "PAGAMENTO_JA_REGISTRADO",
              message:
                "Este pedido já possui um pagamento registrado.",
            },
          };
        }

        const recusado = codigoMock === "RECUSAR";

        // Atualização condicional para impedir que um
        // pedido encerrado receba pagamento.
        const atualizacao = await tx.pedido.updateMany({
          where: {
            id: pedidoId,
            status: {
              notIn: ["CANCELADO", "FINALIZADO"],
            },
          },
          data: {
            status: recusado
              ? "CANCELADO"
              : pedido.status,
          },
        });

        if (atualizacao.count !== 1) {
          return {
            httpStatus: 409,
            body: {
              error: "PEDIDO_ENCERRADO",
              message:
                "O pedido foi encerrado durante a operação.",
            },
          };
        }

        const pagamento = await tx.pagamento.create({
          data: {
            pedidoId,
            metodo: metodoNormalizado,
            status: recusado ? "RECUSADO" : "APROVADO",
            valor: pedido.valorTotal,
            codigoMock: codigoMock ?? null,
          },
        });

        let pontosGanhos = 0;
        let pontosDevolvidos = 0;

        if (recusado) {
          // Devolve os pontos usados no pedido.
          if (pedido.pontosResgatados > 0) {
            await tx.usuario.update({
              where: { id: pedido.usuarioId },
              data: {
                pontosFidelidade: {
                  increment: pedido.pontosResgatados,
                },
              },
            });

            pontosDevolvidos = pedido.pontosResgatados;
          }

          // Repõe os produtos no estoque.
          for (const item of pedido.itens) {
            await tx.produto.update({
              where: { id: item.produtoId },
              data: {
                estoque: {
                  increment: item.quantidade,
                },
              },
            });
          }
        } else if (pedido.usuario.participaFidelidade) {
          pontosGanhos = Math.floor(
            Number(pedido.valorTotal)
          );

          if (pontosGanhos > 0) {
            await tx.usuario.update({
              where: { id: pedido.usuarioId },
              data: {
                pontosFidelidade: {
                  increment: pontosGanhos,
                },
              },
            });
          }
        }

        return {
          httpStatus: 201,
          body: {
            message: recusado
              ? "Pagamento recusado. Pedido cancelado, estoque e pontos devolvidos."
              : "Pagamento aprovado com sucesso.",
            pagamento,
            pedidoStatus: recusado
              ? "CANCELADO"
              : pedido.status,
            pontosGanhos,
            pontosDevolvidos,
          },
        };
      }
    );

    return res
      .status(resultado.httpStatus)
      .json(resultado.body);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        error: "PAGAMENTO_JA_REGISTRADO",
        message:
          "Este pedido já possui um pagamento registrado.",
      });
    }

    console.error("Erro ao processar pagamento:", error);

    return res.status(500).json({
      error: "ERRO_INTERNO",
      message: "Erro ao processar pagamento.",
    });
  }
}

