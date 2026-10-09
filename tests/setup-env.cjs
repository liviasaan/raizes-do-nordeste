const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const arquivo = path.resolve(__dirname, "../.env.test");

if (!fs.existsSync(arquivo)) {
  throw new Error("Arquivo .env.test não encontrado.");
}

const variaveis = dotenv.parse(fs.readFileSync(arquivo));

if (!variaveis.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida no .env.test.");
}

const banco = new URL(variaveis.DATABASE_URL);

if (banco.pathname !== "/raizes_do_nordeste_test") {
  throw new Error("Segurança: os testes devem usar raizes_do_nordeste_test.");
}

process.env.DATABASE_URL = variaveis.DATABASE_URL;
process.env.NODE_ENV = "test";
