# IAverse - Instalação no Servidor

## Arquivos para Download

O arquivo `iaverse-deploy.tar.gz` contém todos os arquivos necessários para instalação:

```
iaverse-deploy.tar.gz
├── index.html          # Interface web da aplicação
├── index.js           # Servidor backend (Node.js)
├── favicon.svg        # Ícone da aplicação
└── assets/           # Recursos estáticos
```

## Requisitos do Servidor

### Sistema Operacional
- Linux (Ubuntu 20.04+ recomendado)
- Windows Server 2019+
- macOS 10.15+

### Software Necessário
```bash
# Node.js 20 ou superior
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL (opcional - pode usar SQLite)
sudo apt-get install postgresql postgresql-contrib
```

## Instalação Passo a Passo

### 1. Fazer Upload dos Arquivos
```bash
# Extrair arquivos no servidor
tar -xzf iaverse-deploy.tar.gz
cd iaverse-deploy/
```

### 2. Configurar Variáveis de Ambiente
```bash
# Criar arquivo .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/iaverse
SESSION_SECRET=sua_chave_secreta_muito_segura_aqui
OPENAI_API_KEY=sua_chave_openai_aqui
EOF
```

### 3. Configurar Banco de Dados (PostgreSQL)
```bash
# Criar banco de dados
sudo -u postgres createdb iaverse
sudo -u postgres createuser iaverse_user
sudo -u postgres psql -c "ALTER USER iaverse_user PASSWORD 'sua_senha';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE iaverse TO iaverse_user;"
```

### 4. Instalar Dependências de Produção
```bash
# Instalar apenas dependências necessárias
npm init -y
npm install express
npm install drizzle-orm
npm install @neondatabase/serverless
npm install bcryptjs
npm install express-session
npm install multer
npm install openai
npm install ws
```

### 5. Iniciar a Aplicação
```bash
# Executar em produção
node index.js

# Ou com PM2 (recomendado)
npm install -g pm2
pm2 start index.js --name iaverse
pm2 startup
pm2 save
```

## Configuração do Nginx (Proxy Reverso)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Verificação da Instalação

1. **Testar API de Saúde:**
```bash
curl http://localhost:3000/api/health
```

2. **Verificar Logs:**
```bash
# Com PM2
pm2 logs iaverse

# Sem PM2
tail -f /var/log/iaverse.log
```

## Configurações Opcionais

### SSL/HTTPS com Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

### Backup Automático
```bash
# Script de backup
cat > backup.sh << 'EOF'
#!/bin/bash
pg_dump iaverse > backup_$(date +%Y%m%d_%H%M%S).sql
EOF
chmod +x backup.sh
```

## Suporte

- Porta padrão: 3000
- Health check: `/api/health`
- Logs: `/var/log/iaverse.log`
- Configuração: `.env`