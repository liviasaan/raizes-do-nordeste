import { Router } from "express";
import { processarPagamento } from "../controllers/pagamento.controller";
import { autenticarToken } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/pedidos/:id/pagamento",
  autenticarToken,
  processarPagamento
);

export default router;