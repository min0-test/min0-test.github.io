import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
<<<<<<< HEAD
export default defineConfig({ base:process.env.VITE_PAGES_BASE??'/', plugins:[react()], define:{'import.meta.env.VITE_STAFF_APP':JSON.stringify('true')}, resolve:{alias:{'@orders':path.resolve(root,'../../src/orders/client.ts')}}, server:{fs:{allow:[path.resolve(root,'../..')]}} });
=======
export default defineConfig({ base:process.env.VITE_PAGES_BASE??'./', plugins:[react()], define:{'import.meta.env.VITE_STAFF_APP':JSON.stringify('true')}, resolve:{dedupe:['react','react-dom'],alias:{'@orders':path.resolve(root,'../../src/orders/client.ts')}}, server:{fs:{allow:[path.resolve(root,'../..')]}} });
>>>>>>> temp-branch
