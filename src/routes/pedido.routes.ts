import { permitirPerfis } from "../middlewares/permissao.middleware";
import { Router } from "express";
import {
  criarPedido,
  atualizarStatusPedido,
} from "../controllers/pedido.controller";
import { autenticarToken } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/pedidos",
  autenticarToken,
  criarPedido
);

router.patch(
  "/pedidos/:id/status",
  autenticarToken,
  permitirPerfis("ADMIN", "GERENTE"),
  atualizarStatusPedido
);

export default router;
