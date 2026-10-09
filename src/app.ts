
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

import swaggerSpec from "./config/swagger";

import raizesRoutes from "./routes/raizes.routes";
import usuarioRoutes from "./routes/usuario.routes";
import produtoRoutes from "./routes/produto.routes";
import estoqueRoutes from "./routes/estoque.routes";
import pedidoRoutes from "./routes/pedido.routes";
import pagamentoRoutes from "./routes/pagamento.routes";

import {
  tratarErros,
  rotaNaoEncontrada,
} from "./middlewares/erro.middleware";

// Carregar variáveis de ambiente sem mensagens extras
dotenv.config({ quiet: true });

const app = express();

// Configurações gerais
app.use(cors());
app.use(express.json());

// Documentação Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Especificação OpenAPI em JSON
app.get("/api-docs.json", (_req, res) => {
  return res.status(200).json(swaggerSpec);
});

// Rotas da API
app.use("/api", raizesRoutes);
app.use("/api", usuarioRoutes);
app.use("/api", produtoRoutes);
app.use("/api", estoqueRoutes);
app.use("/api", pedidoRoutes);
app.use("/api", pagamentoRoutes);

// Rota inicial
app.get("/", (_req, res) => {
  return res.status(200).json({
    mensagem: "API Raízes do Nordeste funcionando!",
  });
});

// Tratamento de rotas inexistentes
app.use(rotaNaoEncontrada);

// Tratamento centralizado de erros
app.use(tratarErros);

// Exportar aplicação para o Jest e Supertest
export default app;
