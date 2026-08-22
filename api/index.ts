// Este arquivo faz a ponte entre a Vercel e o servidor Express (server-core.ts).
// A Vercel chama esta função para QUALQUER rota que comece com /api/...
// Importante: importa de "server-core" (sem Vite) e NÃO de "server" (que tem Vite,
// uma ferramenta de build que não deve ser empacotada dentro da função serverless).
import { app } from "../server-core.js";

export default app;
