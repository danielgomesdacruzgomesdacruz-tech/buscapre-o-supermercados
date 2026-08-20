// Este arquivo faz a ponte entre a Vercel e seu servidor Express (server.ts).
// A Vercel chama esta função para QUALQUER rota que comece com /api/...
import { app } from "../server";

export default app;