# 🚀 Guia de Deploy para Produção

## Pré-requisitos

1. **Node.js** versão 18+ instalado
2. **npm** ou **yarn** instalado
3. **Acesso ao servidor de produção**

## Passos para Deploy

### 1. Preparar o Build

```bash
# Instalar dependências
npm install

# Criar build de produção
npm run build:prod
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.production` na raiz do projeto com as seguintes variáveis:

```env
VITE_API_BASE_URL=https://codigo-zenaix-backend.w9rr1k.easypanel.host
VITE_WEBHOOK_BASE_URL=https://zenoon-agency-n8n.htm57w.easypanel.host/webhook
VITE_SUPABASE_URL=https://samiqqeumkhpfgwdkjvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWlxcWV1bWtocGZnd2RranZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MTM3NTYsImV4cCI6MjA2NzM4OTc1Nn0.tKy_PaZetxDfHqLH626SWPk6fWu8HQvhZCQG-4zXbUM
VITE_WS_URL=wss://zenoon-agency-n8n.htm57w.easypanel.host/ws
NODE_ENV=production
```

### 3. Deploy no Servidor

#### Opção A: Deploy Estático (Recomendado)

1. **Copiar arquivos para servidor:**

   ```bash
   # A pasta dist/ contém os arquivos otimizados
   scp -r dist/* user@your-server:/var/www/html/
   ```

2. **Configurar servidor web (Nginx):**

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/html;
       index index.html;

       # Configuração para SPA
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache para assets estáticos
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

#### Opção B: Deploy com Docker

1. **Criar Dockerfile:**

   ```dockerfile
   FROM nginx:alpine
   COPY dist/ /usr/share/nginx/html/
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build e deploy:**
   ```bash
   docker build -t zenaix-frontend .
   docker run -d -p 80:80 zenaix-frontend
   ```

### 4. Verificações Pós-Deploy

1. **Testar funcionalidades principais:**

   - Login/Registro
   - Navegação entre páginas
   - Upload de arquivos
   - Chat/WebSocket
   - Integração com APIs

2. **Verificar logs:**

   ```bash
   # Nginx logs
   tail -f /var/log/nginx/error.log
   tail -f /var/log/nginx/access.log
   ```

3. **Testar performance:**
   - Lighthouse audit
   - PageSpeed Insights
   - WebPageTest

## Configurações de Segurança

### 1. HTTPS

```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... resto da configuração
}
```

### 2. Headers de Segurança

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Monitoramento

1. **Logs de erro:** Configure alertas para erros 4xx/5xx
2. **Performance:** Monitore tempo de carregamento
3. **Uptime:** Configure health checks
4. **Analytics:** Implemente Google Analytics ou similar

## Rollback

Mantenha versões anteriores para rollback rápido:

```bash
# Backup da versão atual
cp -r /var/www/html /var/www/html.backup.$(date +%Y%m%d_%H%M%S)

# Rollback em caso de problemas
rm -rf /var/www/html
cp -r /var/www/html.backup.20240101_120000 /var/www/html
```
