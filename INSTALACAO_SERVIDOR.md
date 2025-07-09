# 🚀 Instalação Completa do Servidor IAprender

Guia passo a passo para instalação completa do sistema IAprender em ambiente servidor.

## 📋 Requisitos do Sistema

### Hardware Mínimo
- **CPU**: 2 vCPUs (4 recomendado)
- **RAM**: 4GB (8GB recomendado)
- **Armazenamento**: 20GB SSD
- **Rede**: 1Gbps

### Software
- **SO**: Ubuntu 20.04+ LTS ou CentOS 8+
- **Node.js**: 18+ LTS
- **PostgreSQL**: 13+
- **Git**: 2.25+
- **Nginx**: 1.18+ (opcional, para proxy reverso)

## 🛠️ Script de Instalação Automatizada

### 1. Download do Script

```bash
# Fazer download do projeto
git clone https://github.com/seu-usuario/iaprender.git
cd iaprender

# Tornar o script executável
chmod +x install-server.sh
```

### 2. Executar Instalação

```bash
# Instalação completa
sudo ./install-server.sh

# Ou instalação com parâmetros
sudo ./install-server.sh --domain=iaprender.empresa.com.br --ssl=true
```

## 📝 Script de Instalação (install-server.sh)

```bash
#!/bin/bash

# Script de Instalação Automatizada - IAprender
# Versão: 1.0
# Data: 2025-07-09

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
DOMAIN=""
SSL_ENABLED=false
DB_PASSWORD=""
JWT_SECRET=""
PROJECT_DIR="/opt/iaprender"
USER="iaprender"

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

# Função para gerar senhas seguras
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Parse de argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain=*)
            DOMAIN="${1#*=}"
            shift
            ;;
        --ssl=*)
            SSL_ENABLED="${1#*=}"
            shift
            ;;
        --db-password=*)
            DB_PASSWORD="${1#*=}"
            shift
            ;;
        *)
            echo "Argumento desconhecido: $1"
            exit 1
            ;;
    esac
done

# Verificar se está executando como root
if [[ $EUID -ne 0 ]]; then
   error "Este script deve ser executado como root (sudo)"
fi

log "🚀 Iniciando instalação do IAprender..."

# 1. Atualizar sistema
log "📦 Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar dependências básicas
log "📦 Instalando dependências básicas..."
apt install -y curl wget git unzip software-properties-common build-essential

# 3. Instalar Node.js
log "📦 Instalando Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
log "✅ Node.js instalado: $NODE_VERSION"

# 4. Instalar PostgreSQL
log "📦 Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Configurar PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 5. Criar usuário do sistema
log "👤 Criando usuário do sistema..."
if ! id "$USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $PROJECT_DIR $USER
    log "✅ Usuário $USER criado"
else
    log "ℹ️ Usuário $USER já existe"
fi

# 6. Criar diretório do projeto
log "📁 Configurando diretório do projeto..."
mkdir -p $PROJECT_DIR
chown $USER:$USER $PROJECT_DIR

# 7. Configurar banco de dados
log "🗄️ Configurando banco de dados..."
if [[ -z "$DB_PASSWORD" ]]; then
    DB_PASSWORD=$(generate_password)
fi

sudo -u postgres psql -c "CREATE USER $USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE iaprender OWNER $USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE iaprender TO $USER;"

log "✅ Banco de dados configurado"

# 8. Clonar projeto (se não estiver no diretório atual)
if [[ ! -f "package.json" ]]; then
    log "📥 Clonando projeto..."
    cd $PROJECT_DIR
    git clone https://github.com/seu-usuario/iaprender.git .
    chown -R $USER:$USER $PROJECT_DIR
else
    log "📋 Copiando arquivos do projeto..."
    cp -r * $PROJECT_DIR/
    chown -R $USER:$USER $PROJECT_DIR
fi

# 9. Instalar dependências Node.js
log "📦 Instalando dependências Node.js..."
cd $PROJECT_DIR
sudo -u $USER npm install --production

# 10. Configurar variáveis de ambiente
log "⚙️ Configurando variáveis de ambiente..."
if [[ -z "$JWT_SECRET" ]]; then
    JWT_SECRET=$(generate_password)
fi

cat > $PROJECT_DIR/.env << EOF
# Configuração de Produção - IAprender
NODE_ENV=production
PORT=5000

# Banco de Dados
DATABASE_URL=postgresql://$USER:$DB_PASSWORD@localhost:5432/iaprender

# JWT
JWT_SECRET=$JWT_SECRET

# AWS Cognito (configurar depois)
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=
AWS_COGNITO_CLIENT_ID=
AWS_COGNITO_CLIENT_SECRET=
COGNITO_DOMAIN=

# APIs de IA (opcional)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=

# Domínio
DOMAIN=${DOMAIN:-localhost}
EOF

chown $USER:$USER $PROJECT_DIR/.env
chmod 600 $PROJECT_DIR/.env

# 11. Executar migrações do banco
log "🗄️ Executando migrações do banco..."
cd $PROJECT_DIR
sudo -u $USER npm run db:push

# 12. Configurar systemd service
log "⚙️ Configurando serviço systemd..."
cat > /etc/systemd/system/iaprender.service << EOF
[Unit]
Description=IAprender - Sistema de Gestão Educacional
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=iaprender

[Install]
WantedBy=multi-user.target
EOF

# 13. Configurar Nginx (se domínio especificado)
if [[ ! -z "$DOMAIN" ]]; then
    log "🌐 Instalando e configurando Nginx..."
    apt install -y nginx
    
    cat > /etc/nginx/sites-available/iaprender << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/iaprender /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    nginx -t
    systemctl restart nginx
    systemctl enable nginx
    
    log "✅ Nginx configurado para $DOMAIN"
fi

# 14. Configurar SSL (se especificado)
if [[ "$SSL_ENABLED" == "true" && ! -z "$DOMAIN" ]]; then
    log "🔒 Instalando certificado SSL..."
    apt install -y certbot python3-certbot-nginx
    
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    log "✅ SSL configurado"
fi

# 15. Configurar firewall
log "🔥 Configurando firewall..."
ufw --force enable
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 5000/tcp # App (temporário)

# 16. Iniciar serviços
log "🚀 Iniciando serviços..."
systemctl daemon-reload
systemctl enable iaprender
systemctl start iaprender

# Aguardar inicialização
sleep 5

# 17. Verificar status
log "✅ Verificando status dos serviços..."
if systemctl is-active --quiet iaprender; then
    log "✅ IAprender está rodando"
else
    error "❌ Falha ao iniciar IAprender. Verifique os logs: journalctl -u iaprender"
fi

if systemctl is-active --quiet nginx; then
    log "✅ Nginx está rodando"
fi

if systemctl is-active --quiet postgresql; then
    log "✅ PostgreSQL está rodando"
fi

# 18. Configurar backup automático
log "💾 Configurando backup automático..."
mkdir -p /opt/backups/iaprender

cat > /opt/backups/backup-iaprender.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/iaprender"
DB_NAME="iaprender"
DB_USER="iaprender"

# Backup do banco de dados
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos arquivos
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz -C /opt/iaprender .

# Manter apenas backups dos últimos 7 dias
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup realizado: $DATE"
EOF

chmod +x /opt/backups/backup-iaprender.sh

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backups/backup-iaprender.sh") | crontab -

# 19. Configurar logs
log "📝 Configurando logs..."
mkdir -p /var/log/iaprender
chown $USER:$USER /var/log/iaprender

cat > /etc/rsyslog.d/30-iaprender.conf << EOF
if \$programname == 'iaprender' then /var/log/iaprender/app.log
& stop
EOF

systemctl restart rsyslog

# 20. Mostrar informações finais
log "🎉 Instalação concluída com sucesso!"

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                         INSTALAÇÃO CONCLUÍDA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${GREEN}✅ Sistema IAprender instalado e configurado${NC}"
echo -e "${GREEN}✅ Banco de dados PostgreSQL configurado${NC}"
echo -e "${GREEN}✅ Serviço systemd configurado${NC}"
echo -e "${GREEN}✅ Backup automático configurado${NC}"

if [[ ! -z "$DOMAIN" ]]; then
    echo -e "${GREEN}✅ Nginx configurado para $DOMAIN${NC}"
    if [[ "$SSL_ENABLED" == "true" ]]; then
        echo -e "${GREEN}✅ SSL/HTTPS configurado${NC}"
        echo -e "\n${YELLOW}🌐 Acesso: https://$DOMAIN${NC}"
    else
        echo -e "\n${YELLOW}🌐 Acesso: http://$DOMAIN${NC}"
    fi
else
    echo -e "\n${YELLOW}🌐 Acesso: http://localhost:5000${NC}"
fi

echo -e "\n${YELLOW}📋 INFORMAÇÕES IMPORTANTES:${NC}"
echo -e "Usuário do sistema: $USER"
echo -e "Diretório do projeto: $PROJECT_DIR"
echo -e "Senha do banco: $DB_PASSWORD"
echo -e "JWT Secret: $JWT_SECRET"
echo -e "Arquivo de configuração: $PROJECT_DIR/.env"

echo -e "\n${YELLOW}🔧 PRÓXIMOS PASSOS:${NC}"
echo -e "1. Configurar AWS Cognito no arquivo .env"
echo -e "2. Adicionar chaves de APIs de IA (opcional)"
echo -e "3. Acessar o sistema e criar primeiro usuário admin"
echo -e "4. Configurar monitoramento (opcional)"

echo -e "\n${YELLOW}📊 COMANDOS ÚTEIS:${NC}"
echo -e "Status do serviço: systemctl status iaprender"
echo -e "Logs do serviço: journalctl -u iaprender -f"
echo -e "Reiniciar serviço: systemctl restart iaprender"
echo -e "Backup manual: /opt/backups/backup-iaprender.sh"

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Salvar informações em arquivo
cat > $PROJECT_DIR/INSTALACAO_INFO.txt << EOF
IAprender - Informações da Instalação
Data: $(date)

Usuário do sistema: $USER
Diretório: $PROJECT_DIR
Banco de dados: iaprender
Senha do banco: $DB_PASSWORD
JWT Secret: $JWT_SECRET

Domínio: ${DOMAIN:-localhost}
SSL: ${SSL_ENABLED}

Acesso: ${DOMAIN:-http://localhost:5000}

Próximos passos:
1. Configurar AWS Cognito
2. Configurar APIs de IA
3. Criar usuário admin
EOF

chown $USER:$USER $PROJECT_DIR/INSTALACAO_INFO.txt
chmod 600 $PROJECT_DIR/INSTALACAO_INFO.txt

log "💾 Informações salvas em $PROJECT_DIR/INSTALACAO_INFO.txt"
```

## 🔧 Configuração Pós-Instalação

### 1. Configurar AWS Cognito

```bash
# Editar arquivo de configuração
sudo nano /opt/iaprender/.env

# Adicionar variáveis do Cognito
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxx
AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
AWS_COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxx
COGNITO_DOMAIN=https://your-domain.auth.us-east-1.amazoncognito.com

# Reiniciar serviço
sudo systemctl restart iaprender
```

### 2. Configurar APIs de IA (Opcional)

```bash
# Adicionar chaves das APIs
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxx
```

### 3. Configurar Monitoramento

```bash
# Instalar htop para monitoramento básico
sudo apt install -y htop

# Instalar logrotate para rotação de logs
sudo apt install -y logrotate

# Configurar rotação de logs do IAprender
sudo tee /etc/logrotate.d/iaprender << EOF
/var/log/iaprender/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 iaprender iaprender
    postrotate
        systemctl reload iaprender
    endscript
}
EOF
```

## 📊 Comandos de Administração

### Gerenciamento do Serviço

```bash
# Status do serviço
sudo systemctl status iaprender

# Iniciar serviço
sudo systemctl start iaprender

# Parar serviço
sudo systemctl stop iaprender

# Reiniciar serviço
sudo systemctl restart iaprender

# Ver logs em tempo real
sudo journalctl -u iaprender -f

# Ver logs específicos
sudo journalctl -u iaprender --since "1 hour ago"
```

### Backup e Restauração

```bash
# Backup manual
sudo /opt/backups/backup-iaprender.sh

# Listar backups
ls -la /opt/backups/iaprender/

# Restaurar banco de dados
sudo -u iaprender psql iaprender < /opt/backups/iaprender/db_backup_YYYYMMDD_HHMMSS.sql

# Restaurar arquivos
sudo tar -xzf /opt/backups/iaprender/files_backup_YYYYMMDD_HHMMSS.tar.gz -C /opt/iaprender/
```

### Atualização do Sistema

```bash
# Fazer backup antes da atualização
sudo /opt/backups/backup-iaprender.sh

# Parar serviço
sudo systemctl stop iaprender

# Fazer backup do projeto atual
sudo cp -r /opt/iaprender /opt/iaprender.backup

# Atualizar código
cd /opt/iaprender
sudo -u iaprender git pull origin main

# Instalar novas dependências
sudo -u iaprender npm install --production

# Executar migrações
sudo -u iaprender npm run db:push

# Reiniciar serviço
sudo systemctl start iaprender

# Verificar status
sudo systemctl status iaprender
```

## 🛡️ Segurança

### Configurações de Segurança

```bash
# Configurar fail2ban para proteção SSH
sudo apt install -y fail2ban

sudo tee /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

sudo systemctl restart fail2ban

# Configurar updates automáticos
sudo apt install -y unattended-upgrades

sudo tee /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

sudo systemctl enable unattended-upgrades
```

### Monitoramento de Recursos

```bash
# Script de monitoramento
sudo tee /opt/iaprender/monitor.sh << 'EOF'
#!/bin/bash

# Verificar uso de CPU, memória e disco
echo "=== Status do Sistema $(date) ==="

# CPU
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4"%"}'

# Memória
echo "Memory Usage:"
free -h | awk '/^Mem:/ {print $3"/"$2" ("$3/$2*100"%)"}'

# Disco
echo "Disk Usage:"
df -h / | awk '/\// {print $3"/"$2" ("$5")"}'

# Status do serviço
echo "IAprender Service:"
systemctl is-active iaprender

# Conexões ativas
echo "Active Connections:"
ss -tuln | grep :5000

echo "=========================="
EOF

chmod +x /opt/iaprender/monitor.sh

# Adicionar ao crontab para execução a cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/iaprender/monitor.sh >> /var/log/iaprender/monitor.log") | crontab -
```

## 🚨 Troubleshooting

### Problemas Comuns

**1. Serviço não inicia**
```bash
# Verificar logs
sudo journalctl -u iaprender --no-pager

# Verificar permissões
sudo chown -R iaprender:iaprender /opt/iaprender

# Verificar dependências
cd /opt/iaprender
sudo -u iaprender npm install
```

**2. Erro de conexão com banco**
```bash
# Verificar status do PostgreSQL
sudo systemctl status postgresql

# Testar conexão
sudo -u iaprender psql -h localhost -d iaprender -c "SELECT 1;"

# Verificar .env
sudo cat /opt/iaprender/.env | grep DATABASE_URL
```

**3. Erro 502 Bad Gateway (Nginx)**
```bash
# Verificar se aplicação está rodando
sudo systemctl status iaprender

# Verificar configuração do Nginx
sudo nginx -t

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

Com este guia, a instalação do IAprender em servidor será automatizada e padronizada, garantindo uma configuração segura e robusta para ambiente de produção.