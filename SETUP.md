# Setup — Gestão de Filhos

## 1. Variáveis de ambiente

Edite `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://tjjzvvorktxozhdejqgp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua anon key do Supabase>
GEMINI_API_KEY=<sua chave da API Gemini>
```

### Onde obter as chaves:
- **Supabase Anon Key**: Painel Supabase → Settings → API → `anon public`
- **Gemini API Key**: https://aistudio.google.com/app/apikey (gratuito)

---

## 2. Banco de dados (Supabase)

Execute o arquivo `supabase-schema.sql` no SQL Editor do Supabase:
- Painel Supabase → SQL Editor → colar o conteúdo → Run

Crie o bucket de storage para inputs de IA:
- Storage → New bucket → nome: `ai-inputs` → Private

---

## 3. Rodar localmente

```bash
cd gestao-filhos-app
npm install
npm run dev
```

Acesse: http://localhost:3000

---

## 4. Deploy (Vercel — gratuito)

```bash
npm install -g vercel
vercel
```

Ou conecte o repositório GitHub diretamente em https://vercel.com/new

Configure as variáveis de ambiente no painel da Vercel (mesmas do `.env.local`).

---

## 5. Ícones PWA

Para a instalação no celular funcionar visualmente, crie:
- `public/icon-192.png` (192×192px)
- `public/icon-512.png` (512×512px)

Use o emoji 👨‍👩‍👧‍👦 ou crie um ícone personalizado.

---

## 6. Integração Vault

O módulo Documentos linka para o DocVault existente.
Se o Vault está no GitHub Pages, atualize a URL em:
`src/app/(app)/vault/page.tsx`
