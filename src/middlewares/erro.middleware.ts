
import {
  Request,
  Response,
  NextFunction,
} from "express";

// Tratamento de rotas inexistentes
export function rotaNaoEncontrada(
  req: Request,
  res: Response
) {
  return res.status(404).json({
    error: "ROTA_NAO_ENCONTRADA",
    message: "A rota solicitada não existe.",
    details: null,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

// Tratamento centralizado de erros
export function tratarErros(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Erro na API:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    error: "ERRO_INTERNO",
    message: "Ocorreu um erro interno no servidor.",
    details: null,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}
