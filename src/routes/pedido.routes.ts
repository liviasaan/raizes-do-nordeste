import { permitirPerfis } from "../middlewares/permissao.middleware";
import { Router } from "express";
import {
  criarPedido,
  atualizarStatusPedido,
  consultarPedidos,
} from "../controllers/pedido.controller";
import { autenticarToken } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/pedidos",
  autenticarToken,
  criarPedido
);

router.get(
  "/pedidos",
  autenticarToken,
  permitirPerfis("ADMIN", "GERENTE"),
  consultarPedidos
);

router.patch(
  "/pedidos/:id/status",
  autenticarToken,
  permitirPerfis("ADMIN", "GERENTE"),
  atualizarStatusPedido
);

export default router;


