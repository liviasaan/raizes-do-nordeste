
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../database/db";
import { AuthRequest } from "../middlewares/auth.middleware";

// Padronizar respostas de erro
function responderErro(
  req: Request,
  res: Response,
  status: number,
  error: string,
  message: string,
  details: unknown = null
) {
  return res.status(status).json({
    error,
    message,
    details,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

// CADASTRAR USUÁRIO
export async function cadastrarUsuario(req: Request, res: Response) {
  try {
    const {
      nome,
      email,
      senha,
      consentimentoLgpd,
      participaFidelidade = false,
    } = req.body ?? {};

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof senha !== "string" ||
      !senha
    ) {
      return responderErro(
        req,
        res,
        400,
        "DADOS_INVALIDOS",
        "Nome, e-mail e senha são obrigatórios."
      );
    }

    if (senha.length < 6) {
      return responderErro(
        req,
        res,
        422,
        "SENHA_INVALIDA",
        "A senha deve possuir pelo menos 6 caracteres."
      );
    }

    if (consentimentoLgpd !== true) {
      return responderErro(
        req,
        res,
        422,
        "CONSENTIMENTO_LGPD_NECESSARIO",
        "É necessário informar o consentimento para o tratamento dos dados pessoais."
      );
    }

    if (typeof participaFidelidade !== "boolean") {
      return responderErro(
        req,
        res,
        422,
        "FIDELIDADE_INVALIDA",
        "A participação na fidelidade deve ser true ou false."
      );
    }

    const emailNormalizado = email.trim().toLowerCase();

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (usuarioExistente) {
      return responderErro(
        req,
        res,
        409,
        "EMAIL_JA_CADASTRADO",
        "Já existe um usuário cadastrado com este e-mail."
      );
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email: emailNormalizado,
        senha: senhaCriptografada,
        consentimentoLgpd: true,
        dataConsentimento: new Date(),
        participaFidelidade,
      },
    });

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso.",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
        pontosFidelidade: usuario.pontosFidelidade,
        participaFidelidade: usuario.participaFidelidade,
        consentimentoLgpd: usuario.consentimentoLgpd,
        dataConsentimento: usuario.dataConsentimento,
        criadoEm: usuario.criadoEm,
      },
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);

    return responderErro(
      req,
      res,
      500,
      "ERRO_INTERNO",
      "Erro interno do servidor."
    );
  }
}

// LOGIN DO USUÁRIO
export async function loginUsuario(req: Request, res: Response) {
  try {
    const { email, senha } = req.body ?? {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof senha !== "string" ||
      !senha
    ) {
      return responderErro(
        req,
        res,
        400,
        "DADOS_INVALIDOS",
        "E-mail e senha são obrigatórios."
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!usuario) {
      return responderErro(
        req,
        res,
        401,
        "CREDENCIAIS_INVALIDAS",
        "E-mail ou senha inválidos."
      );
    }

    if (!usuario.ativo) {
      return responderErro(
        req,
        res,
        403,
        "USUARIO_INATIVO",
        "Usuário inativo."
      );
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaCorreta) {
      return responderErro(
        req,
        res,
        401,
        "CREDENCIAIS_INVALIDAS",
        "E-mail ou senha inválidos."
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET não configurado.");

      return responderErro(
        req,
        res,
        500,
        "CONFIGURACAO_INVALIDA",
        "Erro interno do servidor."
      );
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
      },
      jwtSecret,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso.",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        pontosFidelidade: usuario.pontosFidelidade,
        participaFidelidade: usuario.participaFidelidade,
      },
    });
  } catch (error) {
    console.error("Erro ao realizar login:", error);

    return responderErro(
      req,
      res,
      500,
      "ERRO_INTERNO",
      "Erro interno do servidor."
    );
  }
}

// LGPD: DESATIVAR A PRÓPRIA CONTA
export async function desativarMinhaConta(
  req: AuthRequest,
  res: Response
) {
  try {
    const usuarioId = Number(req.usuario?.id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return responderErro(
        req,
        res,
        401,
        "NAO_AUTENTICADO",
        "Usuário não autenticado."
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return responderErro(
        req,
        res,
        404,
        "USUARIO_NAO_ENCONTRADO",
        "Usuário não encontrado."
      );
    }

    if (!usuario.ativo) {
      return responderErro(
        req,
        res,
        409,
        "CONTA_JA_DESATIVADA",
        "Esta conta já está desativada."
      );
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { ativo: false },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        atualizadoEm: true,
      },
    });

    return res.status(200).json({
      message: "Conta desativada com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao desativar conta:", error);

    return responderErro(
      req,
      res,
      500,
      "ERRO_INTERNO",
      "Erro ao desativar a conta."
    );
  }
}

// ATIVAR OU DESATIVAR FIDELIDADE
export async function atualizarParticipacaoFidelidade(
  req: AuthRequest,
  res: Response
) {
  try {
    const usuarioId = Number(req.usuario?.id);
    const { participaFidelidade } = req.body ?? {};

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return responderErro(
        req,
        res,
        401,
        "NAO_AUTENTICADO",
        "Usuário não autenticado."
      );
    }

    if (typeof participaFidelidade !== "boolean") {
      return responderErro(
        req,
        res,
        422,
        "FIDELIDADE_INVALIDA",
        "Informe participaFidelidade como true ou false."
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return responderErro(
        req,
        res,
        404,
        "USUARIO_NAO_ENCONTRADO",
        "Usuário não encontrado."
      );
    }

    if (!usuario.ativo) {
      return responderErro(
        req,
        res,
        403,
        "USUARIO_INATIVO",
        "Usuário inativo."
      );
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { participaFidelidade },
      select: {
        id: true,
        nome: true,
        pontosFidelidade: true,
        participaFidelidade: true,
      },
    });

    return res.status(200).json({
      message: participaFidelidade
        ? "Participação na fidelidade ativada."
        : "Participação na fidelidade desativada.",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar fidelidade:", error);

    return responderErro(
      req,
      res,
      500,
      "ERRO_INTERNO",
      "Erro ao atualizar participação na fidelidade."
    );
  }
}
