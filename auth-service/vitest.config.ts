import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // Variáveis usadas só nos testes. O .env real não é carregado.
        env: {
            JWT_SECRET: 'segredo-somente-para-testes',
        },
    },
})
