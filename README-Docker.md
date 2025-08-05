# 🐳 Docker Setup - Zenaix Frontend

Este documento explica como usar Docker para rodar o projeto Zenaix Frontend.

## 📋 Pré-requisitos

- Docker Desktop instalado
- Docker Compose instalado
- Git instalado
- Node.js 20+ (para desenvolvimento local)

## 🚀 Quick Start

### 1. Clone o repositório
```bash
git clone <repository-url>
cd frontend
```

### 2. Deploy com Docker Compose
```bash
# Deploy completo (build + start)
./scripts/docker-build.sh deploy

# Ou usando docker-compose diretamente
docker-compose up -d
```

### 3. Acesse a aplicação
- **Produção**: http://localhost
- **Desenvolvimento**: http://localhost:3000

## 🛠️ Comandos Disponíveis

### Script de Automação
```bash
# Build da imagem
./scripts/docker-build.sh build

# Deploy completo
./scripts/docker-build.sh deploy

# Ambiente de desenvolvimento
./scripts/docker-build.sh dev

# Ver logs
./scripts/docker-build.sh logs

# Parar containers
./scripts/docker-build.sh stop

# Limpar tudo
./scripts/docker-build.sh clean

# Verificar status
./scripts/docker-build.sh status

# Reiniciar aplicação
./scripts/docker-build.sh restart
```

### Docker Compose Direto
```bash
# Build e start
docker-compose up -d

# Build sem cache
docker-compose build --no-cache

# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

## 🏗️ Estrutura do Docker

### Arquivos Criados
- `Dockerfile` - Build multi-stage para produção
- `Dockerfile.dev` - Build para desenvolvimento
- `docker-compose.yml` - Orquestração dos serviços
- `nginx.conf` - Configuração do Nginx
- `.dockerignore` - Arquivos ignorados no build
- `scripts/docker-build.sh` - Script de automação

### Serviços
1. **zenaix-frontend** - Aplicação de produção (porta 80)
2. **zenaix-frontend-dev** - Ambiente de desenvolvimento (porta 3000)

## 🔧 Configurações

### Variáveis de Ambiente
As variáveis são configuradas no `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - VITE_API_BASE_URL=https://codigo-zenaix-backend.w9rr1k.easypanel.host
  - VITE_WEBHOOK_BASE_URL=https://zenoon-agency-n8n.htm57w.easypanel.host/webhook
  - VITE_SUPABASE_URL=https://samiqqeumkhpfgwdkjvb.supabase.co
  - VITE_SUPABASE_ANON_KEY=your_key_here
  - VITE_WS_URL=wss://zenoon-agency-n8n.htm57w.easypanel.host/ws
```

### Portas
- **80** - Aplicação de produção
- **443** - HTTPS (se configurado)
- **3000** - Desenvolvimento

## 🔍 Monitoramento

### Health Check
- Endpoint: `http://localhost/health`
- Verificação automática a cada 30s

### Logs
```bash
# Logs em tempo real
docker-compose logs -f zenaix-frontend

# Logs específicos
docker-compose logs zenaix-frontend | grep ERROR
```

### Status
```bash
# Verificar status dos containers
docker-compose ps

# Verificar recursos
docker stats
```

## 🛡️ Segurança

### Configurações Implementadas
- Usuário não-root no container
- Headers de segurança no Nginx
- Rate limiting
- Content Security Policy
- Gzip compression

### Headers de Segurança
```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 🔄 CI/CD

### GitHub Actions (Exemplo)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and deploy
        run: |
          docker-compose build
          docker-compose up -d
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Porta já em uso
```bash
# Verificar portas em uso
netstat -tulpn | grep :80

# Parar serviço conflitante
sudo systemctl stop apache2  # ou nginx
```

#### 2. Permissões de arquivo
```bash
# Corrigir permissões
chmod +x scripts/docker-build.sh
```

#### 3. Build falha
```bash
# Limpar cache
docker system prune -a

# Rebuild sem cache
docker-compose build --no-cache
```

#### 4. Container não inicia
```bash
# Verificar logs
docker-compose logs zenaix-frontend

# Verificar configuração
docker-compose config
```

### Logs de Debug
```bash
# Logs detalhados
docker-compose logs -f --tail=100 zenaix-frontend

# Executar comando no container
docker-compose exec zenaix-frontend sh
```

## 📊 Performance

### Otimizações Implementadas
- Multi-stage build
- Gzip compression
- Cache de assets estáticos
- Minificação de código
- Lazy loading de chunks

### Métricas
- Tamanho da imagem: ~50MB
- Tempo de build: ~3-5 minutos
- Tempo de startup: ~10-15 segundos

## 🔗 Links Úteis

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Vite Documentation](https://vitejs.dev/)

## 📞 Suporte

Para problemas específicos do Docker:
1. Verifique os logs: `docker-compose logs`
2. Consulte a documentação oficial
3. Abra uma issue no repositório 