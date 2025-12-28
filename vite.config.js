export default defineConfig({
    plugins: [react()],
    server: {
        host: true,   // <- acepta conexiones externas
        port: 3000,   // tu puerto
    }
})
