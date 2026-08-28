import http from 'node:http';
import { createMySqlRepository } from './src/mysql-repository.mjs';
import { createRequestHandler } from './src/app.mjs';

const env=process.env;
const secret=env.JWT_SECRET||'';
const corsOrigins=(env.CORS_ORIGINS||'http://localhost:3000,http://localhost:5173').split(',').map(x=>x.trim()).filter(Boolean);
const repo=createMySqlRepository(env);
await repo.ping();
const handler=createRequestHandler({repo,secret,sessionHours:Number(env.SESSION_HOURS||2),production:env.NODE_ENV==='production',corsOrigins});
const host=env.HOST||'127.0.0.1',port=Number(env.PORT||4173);
const server=http.createServer(handler);
server.listen(port,host,()=>console.log(`SRTOS QLD Assessment 3 MySQL API: http://${host}:${port}`));
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,async()=>{server.close();await repo.close();process.exit(0)});
