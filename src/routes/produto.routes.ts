import { Router } from "express";
import {
  cadastrarProduto,
  listarProdutos,
  buscarProduto,
  atualizarProduto,
  excluirProduto,
} from "../controllers/produto.controller";

import { autenticarToken } from "../middlewares/auth.middleware";
import { permitirPerfis } from "../middlewares/permissao.middleware";

const router = Router();

// Listar todos os produtos
router.get("/produtos", listarProdutos);

// Buscar produto pelo ID
router.get("/produtos/:id", buscarProduto);

// Cadastrar produto
router.post("/produtos", autenticarToken, permitirPerfis("ADMIN", "GERENTE"), cadastrarProduto);

// Atualizar produto
router.put("/produtos/:id", autenticarToken, permitirPerfis("ADMIN", "GERENTE"), atualizarProduto);

// Excluir produto
router.delete("/produtos/:id", autenticarToken, permitirPerfis("ADMIN", "GERENTE"), excluirProduto);

export default router;
