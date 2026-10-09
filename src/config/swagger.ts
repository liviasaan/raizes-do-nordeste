
import swaggerJsdoc from "swagger-jsdoc";

const bearerAuth = [{ bearerAuth: [] }];

const resposta = (descricao: string) => ({
  description: descricao,
});

const parametroId = {
  name: "id",
  in: "path",
  required: true,
  description: "ID do registro",
  schema: { type: "integer", minimum: 1 },
};

const corpo = (schema: object) => ({
  required: true,
  content: {
    "application/json": {
      schema,
    },
  },
});

const referencia = (nome: string) => ({
  $ref: `#/components/schemas/${nome}`,
});

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Raízes do Nordeste",
      version: "1.0.0",
      description:
        "Documentação da API REST de usuários, autenticação, LGPD, fidelidade, produtos, estoque, pedidos e pagamentos simulados.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor local",
      },
    ],
    tags: [
      { name: "Sistema", description: "Informações da API" },
      { name: "Usuários", description: "Cadastro e autenticação" },
      { name: "LGPD", description: "Privacidade e desativação de conta" },
      { name: "Fidelidade", description: "Programa de pontos" },
      { name: "Produtos", description: "Gerenciamento de produtos" },
      { name: "Estoque", description: "Movimentação de estoque" },
      { name: "Pedidos", description: "Criação e atualização de pedidos" },
      { name: "Pagamentos", description: "Pagamentos simulados" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Informe o token JWT obtido no login.",
        },
      },
      schemas: {
        CadastroUsuario: {
          type: "object",
          required: ["nome", "email", "senha", "consentimentoLgpd"],
          properties: {
            nome: {
              type: "string",
              example: "Maria Silva",
            },
            email: {
              type: "string",
              format: "email",
              example: "maria@teste.com",
            },
            senha: {
              type: "string",
              example: "123456",
            },
            participaFidelidade: {
              type: "boolean",
              example: false,
            },
            consentimentoLgpd: {
              type: "boolean",
              example: true,
            },
          },
        },
        Login: {
          type: "object",
          required: ["email", "senha"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "maria@teste.com",
            },
            senha: {
              type: "string",
              example: "123456",
            },
          },
        },
        Fidelidade: {
          type: "object",
          required: ["participaFidelidade"],
          description:
            "Permite ativar ou desativar a participação do usuário autenticado no programa de fidelidade.",
          properties: {
            participaFidelidade: {
              type: "boolean",
              example: true,
              description:
                "Informe true para participar ou false para deixar de participar.",
            },
          },
        },
        Produto: {
          type: "object",
          required: ["nome", "preco"],
          properties: {
            nome: {
              type: "string",
              example: "Cuscuz Nordestino",
            },
            descricao: {
              type: "string",
              example: "Cuscuz tradicional de milho",
            },
            preco: {
              type: "number",
              format: "double",
              example: 12.9,
            },
            estoque: {
              type: "integer",
              example: 15,
            },
            ativo: {
              type: "boolean",
              example: true,
            },
          },
        },
        MovimentacaoEstoque: {
          type: "object",
          required: ["quantidade", "tipo"],
          description:
            "Movimentação de estoque permitida apenas para ADMIN ou GERENTE.",
          properties: {
            quantidade: {
              type: "integer",
              minimum: 1,
              example: 10,
            },
            tipo: {
              type: "string",
              enum: ["ENTRADA", "SAIDA"],
              example: "ENTRADA",
            },
          },
        },

        ItemPedido: {
          type: "object",
          required: ["produtoId", "quantidade"],
          properties: {
            produtoId: {
              type: "integer",
              example: 1,
            },
            quantidade: {
              type: "integer",
              example: 1,
            },
          },
        },
        CriarPedido: {
          type: "object",
          required: ["usuarioId", "canalPedido", "itens"],
          properties: {
            usuarioId: {
              type: "integer",
              example: 1,
            },
            canalPedido: {
              type: "string",
              enum: ["APP", "TOTEM", "BALCAO", "PICKUP", "WEB"],
              example: "APP",
            },
            itens: {
              type: "array",
              items: referencia("ItemPedido"),
              example: [
                {
                  produtoId: 1,
                  quantidade: 1,
                },
              ],
            },
            pontosResgatados: {
              type: "integer",
              multipleOf: 100,
              minimum: 0,
              example: 0,
              description:
                "Cada 100 pontos equivalem a R$ 5 de desconto.",
            },
          },
        },
        AtualizarStatus: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: [
                "PENDENTE",
                "EM_PREPARO",
                "PRONTO",
                "FINALIZADO",
                "CANCELADO",
              ],
              example: "EM_PREPARO",
            },
          },
        },
        Pagamento: {
          type: "object",
          required: ["metodo"],
          properties: {
            metodo: {
              type: "string",
              enum: ["PIX", "CARTAO", "DINHEIRO"],
              example: "PIX",
            },
            codigoMock: {
              type: "string",
              enum: ["RECUSAR"],
              description:
                "Opcional. Informe RECUSAR para simular uma recusa.",
            },
          },
        },
      },
    },
    paths: {
      "/": {
        get: {
          tags: ["Sistema"],
          summary: "Verificar funcionamento da API",
          responses: {
            "200": resposta("API funcionando"),
          },
        },
      },

      "/api/raizes": {
        get: {
          tags: ["Sistema"],
          summary: "Consultar mensagem do projeto",
          responses: {
            "200": resposta("Mensagem Raízes do Nordeste"),
          },
        },
      },

      "/api/usuarios": {
        post: {
          tags: ["Usuários"],
          summary: "Cadastrar usuário",
          requestBody: corpo(referencia("CadastroUsuario")),
          responses: {
            "201": resposta("Usuário cadastrado"),
            "400": resposta("Dados inválidos ou incompletos"),
            "409": resposta("Conflito no cadastro"),
          },
        },
      },

      "/api/login": {
        post: {
          tags: ["Usuários"],
          summary: "Realizar login",
          requestBody: corpo(referencia("Login")),
          responses: {
            "200": resposta("Login realizado e token JWT gerado"),
            "400": resposta("Dados inválidos"),
            "401": resposta("Credenciais inválidas"),
          },
        },
      },

      "/api/perfil": {
        get: {
          tags: ["Usuários"],
          summary: "Consultar perfil autenticado",
          security: bearerAuth,
          responses: {
            "200": resposta("Perfil consultado"),
            "401": resposta("Token ausente ou inválido"),
          },
        },
      },

      "/api/usuarios/me/desativar": {
        patch: {
          tags: ["LGPD"],
          summary: "Desativar a própria conta",
          description:
            "Desativa a conta do usuário autenticado, conforme as regras implementadas no controlador.",
          security: bearerAuth,
          responses: {
            "200": resposta("Solicitação processada"),
            "401": resposta("Não autorizado"),
          },
        },
      },

      "/api/usuarios/me/fidelidade": {
        patch: {
          tags: ["Fidelidade"],
          summary: "Atualizar participação na fidelidade",
          security: bearerAuth,
          requestBody: corpo(referencia("Fidelidade")),
          responses: {
            "200": resposta("Participação atualizada"),
            "400": resposta("Dados inválidos"),
            "401": resposta("Não autorizado"),
          },
        },
      },

      "/api/produtos": {
        get: {
          tags: ["Produtos"],
          summary: "Listar todos os produtos",
          responses: {
            "200": resposta("Lista de produtos"),
          },
        },
        post: {
          tags: ["Produtos"],
          summary: "Cadastrar produto", description: "Apenas ADMIN ou GERENTE.",
          security: bearerAuth,
          requestBody: corpo(referencia("Produto")),
          responses: {
            "201": resposta("Produto cadastrado"),
            "400": resposta("Dados inválidos"),
            "401": resposta("Não autorizado"),
            "403": resposta("Acesso negado ou operação não permitida"),
          },
        },
      },

      "/api/produtos/{id}": {
        get: {
          tags: ["Produtos"],
          summary: "Buscar produto pelo ID",
          parameters: [parametroId],
          responses: {
            "200": resposta("Produto encontrado"),
            "404": resposta("Produto não encontrado"),
          },
        },
        put: {
          tags: ["Produtos"],
          summary: "Atualizar produto", description: "Apenas ADMIN ou GERENTE.",
          security: bearerAuth,
          parameters: [parametroId],
          requestBody: corpo(referencia("Produto")),
          responses: {
            "200": resposta("Produto atualizado"),
            "400": resposta("Dados inválidos"),
            "401": resposta("Não autorizado"),
            "403": resposta("Acesso negado ou operação não permitida"),
            "404": resposta("Produto não encontrado"),
          },
        },
        delete: {
          tags: ["Produtos"],
          summary: "Excluir produto", description: "Apenas ADMIN ou GERENTE.",
          security: bearerAuth,
          parameters: [parametroId],
          responses: {
            "200": resposta("Exclusão processada"),
            "401": resposta("Não autorizado"),
            "403": resposta("Acesso negado ou operação não permitida"),
            "404": resposta("Produto não encontrado"),
          },
        },
      },

      "/api/produtos/{id}/estoque": {
        patch: {
          tags: ["Estoque"],
          summary: "Movimentar estoque de um produto", description: "Apenas ADMIN ou GERENTE.",
          security: bearerAuth,
          parameters: [parametroId],
          requestBody: corpo(referencia("MovimentacaoEstoque")),
          responses: {
            "200": resposta("Estoque atualizado"),
            "400": resposta("Movimentação inválida"),
            "401": resposta("Não autorizado"),
            "403": resposta("Acesso negado ou operação não permitida"),
            "404": resposta("Produto não encontrado"),
            "409": resposta("Estoque insuficiente"),
          },
        },
      },

      "/api/pedidos": {
        post: {
          tags: ["Pedidos"],
          summary: "Criar pedido",
          description:
            "Exige autenticação. CLIENTE só pode criar pedidos para si mesmo; ADMIN e GERENTE podem criar para outros usuários. Verifica estoque e pontos, aplica promoção de 10% em pedidos a partir de R$ 50 e permite resgatar pontos.",
          security: bearerAuth,
          requestBody: corpo(referencia("CriarPedido")),
          responses: {
            "201": resposta("Pedido criado"),
            "400": resposta("Dados obrigatórios ausentes"),
            "401": resposta("Não autorizado"),
            "403": resposta("Acesso negado ou operação não permitida"),
            "404": resposta("Usuário ou produto não encontrado"),
            "409": resposta("Estoque ou pontos insuficientes"),
            "422": resposta("Dados inválidos"),
          },
        },
      },

      "/api/pedidos/{id}/status": {
        patch: {
          tags: ["Pedidos"],
          summary: "Atualizar status de um pedido",
          description:
            "Apenas ADMIN ou GERENTE. O cancelamento devolve estoque e pontos resgatados. A finalização exige pagamento aprovado.",
          security: bearerAuth,
          parameters: [parametroId],
          requestBody: corpo(referencia("AtualizarStatus")),
          responses: {
            "200": resposta("Status atualizado"),
            "400": resposta("Dados inválidos"),
            "401": resposta("Não autorizado"),
            "403": resposta("Acesso negado ou operação não permitida"),
            "404": resposta("Pedido não encontrado"),
            "409": resposta("Operação não permitida"),
          },
        },
      },

      "/api/pedidos/{id}/pagamento": {
        post: {
          tags: ["Pagamentos"],
          summary: "Processar pagamento simulado",
          description:
            "Exige autenticação. CLIENTE só pode pagar seus próprios pedidos; ADMIN e GERENTE podem pagar pedidos de outros usuários. Simula pagamento por PIX, cartão ou dinheiro. Um pagamento aprovado pode gerar pontos. Um pagamento recusado cancela o pedido e devolve estoque e pontos resgatados.",
          security: bearerAuth,
          parameters: [parametroId],
          requestBody: corpo(referencia("Pagamento")),
          responses: {
            "201": resposta("Pagamento aprovado ou recusado"),
            "400": resposta("Dados inválidos"),
            "401": resposta("Não autorizado"),
            "403": resposta("Acesso negado ou operação não permitida"),
            "404": resposta("Pedido não encontrado"),
            "409": resposta("Pagamento duplicado ou pedido encerrado"),
            "422": resposta("Método inválido"),
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;




