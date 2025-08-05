# Changelog

## [2024-01-XX] - Node.js 20 Update

### ✨ Melhorias
- **Atualizado Node.js de 18 para 20** em todos os Dockerfiles
- **Adicionada configuração de engines** no package.json
- **Atualizada documentação** para refletir a nova versão

### 🔧 Alterações Técnicas
- `Dockerfile`: Node.js 18-alpine → 20-alpine
- `Dockerfile.dev`: Node.js 18-alpine → 20-alpine
- `package.json`: Adicionado engines.node >=20.0.0
- `deploy.md`: Atualizado pré-requisitos para Node.js 20+
- `README-Docker.md`: Atualizada documentação

### 📋 Compatibilidade
- **Node.js**: >=20.0.0
- **npm**: >=10.0.0
- **Docker**: Qualquer versão recente
- **Docker Compose**: Qualquer versão recente

### 🚀 Benefícios
- Melhor performance do Node.js 20
- Suporte a recursos mais recentes
- Melhor segurança
- Compatibilidade com dependências mais recentes 