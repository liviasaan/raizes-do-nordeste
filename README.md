# Raízes do Nordeste - API Back-End

## Sobre o projeto

API REST desenvolvida para o projeto academico Raizes do Nordeste, com funcionalidades de gerenciamento de usuarios, produtos, estoque, pedidos e pagamentos simulados.

## Tecnologias utilizadas

- Node.js e TypeScript
- Express
- PostgreSQL
- Prisma ORM
- JWT e bcrypt
- Swagger / OpenAPI
- Jest e Supertest


## Instalacao e configuracao

Requisitos:
- Node.js 24 ou superior
- PostgreSQL
- npm

1. Instale as dependencias:

   npm.cmd install

2. Crie o arquivo .env a partir do exemplo:

   Copy-Item .env.example .env

3. Configure no .env:
   - DATABASE_URL: conexao com o PostgreSQL
   - JWT_SECRET: chave secreta forte para autenticacao
   - PORT: porta da API (padrao 3000)

4. Aplique as migracoes do banco:

   npx.cmd prisma migrate deploy

5. Gere o cliente Prisma:

   npx.cmd prisma generate

6. Inicie a API em desenvolvimento:

   npm.cmd run dev


## Acesso a API

Com o servidor iniciado, acesse:

- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs

O Swagger apresenta a documentacao dos endpoints da API.

## Comandos disponiveis

- npm.cmd run dev: inicia o servidor em desenvolvimento.
- npm.cmd run build: gera o cliente Prisma e compila o TypeScript.
- npm.cmd start: executa a versao compilada.
- npm.cmd run typecheck: verifica os tipos do TypeScript.
- npm.cmd test -- --runInBand: executa os testes automatizados.

## Testes

Os testes utilizam Jest e Supertest e ficam na pasta tests.

Para executar:

npm.cmd test -- --runInBand

## Repositorio

https://github.com/liviasaan/raizes-do-nordeste

