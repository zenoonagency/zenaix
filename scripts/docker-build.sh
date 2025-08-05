#!/bin/bash

# Script para build e deploy do Docker
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Função para build
build() {
    log "Iniciando build da imagem Docker..."
    
    # Remover containers e imagens antigas
    log "Limpando containers e imagens antigas..."
    docker-compose down --rmi all --volumes --remove-orphans 2>/dev/null || true
    
    # Build da imagem
    log "Construindo imagem..."
    docker-compose build --no-cache zenaix-frontend
    
    log "Build concluído com sucesso!"
}

# Função para deploy
deploy() {
    log "Iniciando deploy..."
    
    # Parar containers existentes
    log "Parando containers existentes..."
    docker-compose down 2>/dev/null || true
    
    # Iniciar containers
    log "Iniciando containers..."
    docker-compose up -d zenaix-frontend
    
    # Aguardar health check
    log "Aguardando health check..."
    sleep 10
    
    # Verificar status
    if docker-compose ps | grep -q "Up"; then
        log "Deploy concluído com sucesso!"
        log "Aplicação disponível em: http://localhost"
        log "Health check: http://localhost/health"
    else
        error "Falha no deploy. Verifique os logs com: docker-compose logs"
        exit 1
    fi
}

# Função para desenvolvimento
dev() {
    log "Iniciando ambiente de desenvolvimento..."
    docker-compose --profile dev up -d zenaix-frontend-dev
    log "Ambiente de desenvolvimento disponível em: http://localhost:3000"
}

# Função para logs
logs() {
    log "Exibindo logs..."
    docker-compose logs -f zenaix-frontend
}

# Função para parar
stop() {
    log "Parando containers..."
    docker-compose down
    log "Containers parados."
}

# Função para limpar
clean() {
    log "Limpando tudo..."
    docker-compose down --rmi all --volumes --remove-orphans
    docker system prune -f
    log "Limpeza concluída."
}

# Função para status
status() {
    log "Status dos containers:"
    docker-compose ps
}

# Menu principal
case "${1:-}" in
    "build")
        build
        ;;
    "deploy")
        build
        deploy
        ;;
    "dev")
        dev
        ;;
    "logs")
        logs
        ;;
    "stop")
        stop
        ;;
    "clean")
        clean
        ;;
    "status")
        status
        ;;
    "restart")
        stop
        deploy
        ;;
    *)
        echo -e "${BLUE}Uso: $0 {build|deploy|dev|logs|stop|clean|status|restart}${NC}"
        echo ""
        echo "Comandos disponíveis:"
        echo "  build   - Construir imagem Docker"
        echo "  deploy  - Build e deploy da aplicação"
        echo "  dev     - Iniciar ambiente de desenvolvimento"
        echo "  logs    - Exibir logs dos containers"
        echo "  stop    - Parar containers"
        echo "  clean   - Limpar tudo (containers, imagens, volumes)"
        echo "  status  - Verificar status dos containers"
        echo "  restart - Reiniciar aplicação"
        exit 1
        ;;
esac 