
import { Router } from "express";

import {
  cadastrarUsuario,
  loginUsuario,
  desativarMinhaConta,
  atualizarParticipacaoFidelidade,
} from "../controllers/usuario.controller";

import {
  autenticarToken,
  AuthRequest,
} from "../middlewares/auth.middleware";

const router = Router();

// CADASTRO DE USUÁRIO
router.post("/usuarios", cadastrarUsuario);

// LOGIN DO USUÁRIO
router.post("/login", loginUsuario);

// CONSULTAR PERFIL AUTENTICADO
router.get("/perfil", autenticarToken, (req: AuthRequest, res) => {
  return res.status(200).json({
    message: "Acesso autorizado.",
    usuario: req.usuario,
  });
});

// LGPD: DESATIVAR A PRÓPRIA CONTA
router.patch(
  "/usuarios/me/desativar",
  autenticarToken,
  desativarMinhaConta
);

// FIDELIDADE: ATIVAR OU DESATIVAR PARTICIPAÇÃO
router.patch(
  "/usuarios/me/fidelidade",
  autenticarToken,
  atualizarParticipacaoFidelidade
);

// EXPORTAÇÃO DAS ROTAS
export default router;
