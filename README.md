# Gamma Quant — Site Institucional

Site institucional oficial da **Gamma Quant** — Plataforma quantitativa de investimentos.

## Estrutura

```
gammaquant-institucional/
├── index.html              # Página única institucional
├── css/
│   └── styles.css          # Todos os estilos (responsive)
├── js/
│   └── main.js             # Navegação, form, animações
├── images/
│   ├── logo-white.svg      # Logo para navbar (fundo escuro)
│   ├── logo-color.svg      # Logo para materiais (fundo claro)
│   └── favicon.svg         # Favicon
└── README.md
```

## Identidade Visual Aplicada

- **Cor primária:** Laranja `#f58a00`
- **Cor secundária:** Preto `#000000`
- **Tipografia:** Montserrat (alternativa gratuita ao Gotham)
- **Tom de voz:** Racional, técnico, institucional, sem hype
- **Arquétipo:** Estrategista / Engenheiro / Arquiteto

## Seções do Site

1. **Navegação fixa** (com scroll detection + active link)
2. **Hero** — proposta de valor principal + CTAs
3. **Faixa de valores** — 4 princípios da marca
4. **Método** — 3 pilares (convergência, assimetria, volatilidade modelada)
5. **Plataforma** — 6 funcionalidades
6. **Para Quem É** — 4 perfis de investidor
7. **Narrativa** — quote institucional
8. **Formulário de Lead** — nome, WhatsApp, email, perfil qualificador
9. **CTA Final** — botão para página de vendas
10. **Footer** — institucional + disclaimers + LGPD

## Formulário de Captura

Campos:
- Nome completo
- WhatsApp (com máscara automática)
- E-mail (validação)
- Pergunta qualificadora: nível no mercado (5 opções)

### Integração de Backend

O form está preparado para integração. Ver `js/main.js` — bloco comentado com exemplo de `fetch()` para N8N webhook:

```javascript
fetch('https://n8n.gammaquant.com.br/webhook/lead-institucional', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
})
```

Enquanto a integração não está ativa, o form:
- Valida campos
- Salva lead no `localStorage` como backup
- Abre WhatsApp automaticamente com mensagem pré-preenchida

## Contatos

- **WhatsApp:** 21 99008-9490 (botão flutuante + footer + form)
- **Página de vendas:** https://portal.gammaquant.com.br/gammaquant-new

## Como Rodar Localmente

```bash
# Opção 1 — Python
cd gammaquant-institucional
python -m http.server 8000
# Abrir http://localhost:8000

# Opção 2 — Node
npx serve .

# Opção 3 — Abrir direto
# Clicar duas vezes em index.html
```

## Deploy Recomendado

### Vercel (gratuito, 1 comando)
```bash
npm i -g vercel
vercel
```

### Netlify (arrastar e soltar)
1. Acesse https://app.netlify.com/drop
2. Arraste a pasta `gammaquant-institucional`
3. Pronto

### GitHub Pages
```bash
git init
git add .
git commit -m "feat: site institucional Gamma Quant"
git remote add origin https://github.com/marcio351/gammaquant-institucional.git
git push -u origin main
# Ativar Pages em Settings > Pages
```

### VPS próprio (Nginx)
Servir a pasta estática via Nginx/Apache apontando para `index.html`.

## Checklist de Produção

- [ ] Substituir integração mock do form pelo webhook real do N8N
- [ ] Adicionar Google Analytics / Meta Pixel
- [ ] Substituir logo SVG placeholder pelo logo oficial (arquivo .svg original da Gamma Quant)
- [ ] Adicionar imagem Open Graph `images/og-image.png` (1200x630)
- [ ] Hospedar fonte Gotham oficial (se disponível) ou manter Montserrat
- [ ] Configurar HTTPS no domínio de produção
- [ ] Adicionar páginas legais: Política de Privacidade, Termos, LGPD

---

**Gamma Quant** — O mercado é volátil. Nós operamos com método.
