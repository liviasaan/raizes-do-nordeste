
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../database/db";

interface TokenPayload {
  id: number;
  email: string;
  perfil: string;
}

export interface AuthRequest extends Request {
  usuario?: TokenPayload;
}

// Middleware de autenticação JWT
export async function autenticarToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // Verificar se o token foi informado
  if (!authHeader) {
    return res.status(401).json({
      error: "NAO_AUTORIZADO",
      message: "Token de autenticação não informado.",
    });
  }

  // Verificar o formato Bearer
  const partes = authHeader.split(" ");

  if (
    partes.length !== 2 ||
    partes[0] !== "Bearer" ||
    !partes[1]
  ) {
    return res.status(401).json({
      error: "TOKEN_INVALIDO",
      message: "Formato do token inválido.",
    });
  }

  const token = partes[1];

  // Verificar configuração do JWT
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    console.error("JWT_SECRET não configurado.");

    return res.status(500).json({
      error: "ERRO_CONFIGURACAO",
      message: "Erro interno de configuração do servidor.",
    });
  }

  let dados: string | JwtPayload;

  // Validar assinatura e validade do token
  try {
    dados = jwt.verify(token, segredo, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    return res.status(401).json({
      error: "TOKEN_INVALIDO",
      message: "Token inválido ou expirado.",
    });
  }

  // Validar informações do token
  if (
    typeof dados === "string" ||
    !Number.isInteger(dados.id) ||
    dados.id <= 0
  ) {
    return res.status(401).json({
      error: "TOKEN_INVALIDO",
      message: "Token não contém um usuário válido.",
    });
  }

  try {
    // Consultar o usuário no banco
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: dados.id,
      },
      select: {
        id: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });

    // Usuário não encontrado
    if (!usuario) {
      return res.status(401).json({
        error: "USUARIO_NAO_ENCONTRADO",
        message: "Usuário não encontrado.",
      });
    }

    // Bloquear usuário desativado
    if (!usuario.ativo) {
      return res.status(403).json({
        error: "USUARIO_INATIVO",
        message: "Esta conta está desativada.",
      });
    }

    // Usar dados atuais do banco, não os dados antigos do token
    req.usuario = {
      id: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
    };

    next();
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);

    return res.status(500).json({
      error: "ERRO_INTERNO",
      message: "Erro ao verificar a autenticação.",
    });
  }
}
