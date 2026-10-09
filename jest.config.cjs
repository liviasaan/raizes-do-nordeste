module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  clearMocks: true,
  setupFiles: ["<rootDir>/tests/setup-env.cjs"],
};
