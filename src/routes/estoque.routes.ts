import { Router } from "express";
import { movimentarEstoque } from "../controllers/estoque.controller";
import { autenticarToken } from "../middlewares/auth.middleware";
import { permitirPerfis } from "../middlewares/permissao.middleware";

const router = Router();

router.patch(
  "/produtos/:id/estoque",
  autenticarToken,
  permitirPerfis("ADMIN", "GERENTE"),
  movimentarEstoque
);

export default router;
