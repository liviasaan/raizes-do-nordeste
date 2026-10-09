import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export function permitirPerfis(...perfisPermitidos: string[]) {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.usuario) {
      return res.status(401).json({
        error: "NAO_AUTORIZADO",
        message: "É necessário estar autenticado.",
      });
    }

    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({
        error: "ACESSO_NEGADO",
        message: "Você não possui permissão para esta operação.",
      });
    }

    next();
  };
}
