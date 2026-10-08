import { createServer, type Plugin } from 'vite';
import path from 'node:path';

// Vite only: no dotenvx, Express, DB, Firebase, or paid-provider initialization.
// Remove inherited credential variables before loading the application config.
for (const name of Object.keys(process.env)) {
  if (/KEY|SECRET|TOKEN|DATABASE_URL|FIREBASE|NEON_|REPL_ID/.test(name)) delete process.env[name];
}

const appRoot = path.resolve(process.env.LAICA_VISUAL_APP_ROOT || '.');
const endpoint = new URL(process.env.LAICA_VISUAL_BASE_URL || 'http://127.0.0.1:4174');
// Tailwind 3's PostCSS plugin resolves its config/content relative to CWD.
// The baseline must run its own engine and config, not the harness checkout's.
process.chdir(appRoot);
const authId = '\0virtual:laica-visual-auth';
const componentId = '\0virtual:laica-visual-components';

const authModule = `
const listeners = new Set();
const user = () => {
  const mode = window.__LAICA_VISUAL_AUTH_MODE__ || 'linked';
  if (mode === 'signed-out') return null;
  return { uid: 'visual-fixture-user', email: mode === 'guest' ? null : 'visual@example.test',
    displayName: 'Fixture Cook', photoURL: null, emailVerified: true, isAnonymous: mode === 'guest' };
};
const setMode = mode => { window.__LAICA_VISUAL_AUTH_MODE__ = mode; listeners.forEach(callback => callback(user())); };
export const auth = { get currentUser() { return user(); } };
export class FirebaseAuthService {
  static async getIdToken() { return user() ? 'synthetic-browser-fixture-token' : null; }
  static async getAppCheckToken() { return null; }
  static onAuthStateChanged(callback) { listeners.add(callback); queueMicrotask(() => callback(user())); return () => listeners.delete(callback); }
  static async handleRedirectResult() { return null; }
  static getCurrentUser() { return user(); }
  static async signInAsGuest() { setMode('guest'); return user(); }
  static async signOut() { setMode('signed-out'); }
}
export async function consumeDevAuthCustomTokenForDev() { return null; }
`;

const componentModule = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '/src/components/ui/theme-provider';
import { TooltipProvider } from '/src/components/ui/tooltip';
import { Toaster } from '/src/components/ui/toaster';
import GroceryListMobile from '/src/pages/grocery-list-mobile';
import { Button } from '/src/components/ui/button';
import { Input } from '/src/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '/src/components/ui/select';
import { Switch } from '/src/components/ui/switch';
import '/src/index.css';
const h = React.createElement;
function Primitives() {
  const [checked, setChecked] = React.useState(false);
  return h('main', { className: 'mx-auto flex max-w-md flex-col gap-6 bg-background p-6 text-foreground' },
    h('h1', { className: 'text-2xl font-bold' }, 'Existing primitives fixture'),
    h('label', { htmlFor: 'fixture-input' }, 'Fixture input'),
    h(Input, { id: 'fixture-input', placeholder: 'Focus this input' }),
    h(Button, { variant: 'outline' }, 'Outline button'),
    h(Button, { disabled: true }, 'Disabled button'),
    h(Select, { defaultValue: 'first' },
      h(SelectTrigger, { 'aria-label': 'Fixture choice' }, h(SelectValue)),
      h(SelectContent, null, h(SelectItem, { value: 'first' }, 'First choice'), h(SelectItem, { value: 'second' }, 'Second choice'))),
    h('div', { className: 'flex items-center gap-3' }, h(Switch, { 'aria-label': 'Fixture switch', checked, onCheckedChange: setChecked }), 'Fixture switch'));
}
const surface = new URL(location.href).searchParams.get('surface');
const content = surface === 'grocery' ? h(GroceryListMobile) : h(Primitives);
createRoot(document.getElementById('root')).render(h(ThemeProvider, { defaultTheme: 'light' },
  h(QueryClientProvider, { client: new QueryClient() }, h(TooltipProvider, null, content, h(Toaster)))));
`;

const fixtures: Plugin = {
  name: 'laica-visual-fixtures',
  enforce: 'pre',
  resolveId(id, importer) {
    if (id === '@/lib/firebase' || /\/client\/src\/lib\/firebase(?:\.ts)?$/.test(id)
      || (id === './lib/firebase' && importer?.endsWith('/client/src/main.tsx'))) return authId;
    if (id === 'virtual:laica-visual-components') return componentId;
  },
  load(id) {
    if (id === authId) return authModule;
    if (id === componentId) return componentModule;
  },
  configureServer(server) {
    server.middlewares.use('/__visual-components', async (_request, response, next) => {
      try {
        const html = await server.transformIndexHtml('/__visual-components',
          '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import "virtual:laica-visual-components";</script></body></html>');
        response.setHeader('Content-Type', 'text/html');
        response.end(html);
      } catch (error) { next(error); }
    });
  },
};

const server = await createServer({
  configFile: path.join(appRoot, 'vite.config.ts'),
  root: path.join(appRoot, 'client'),
  plugins: [fixtures],
  server: { host: endpoint.hostname, port: Number(endpoint.port), strictPort: true },
});
await server.listen();
console.log(`Fixture-only Vite serving ${endpoint.origin}`);
