# Como Baixar e Instalar o IAverse no Seu Servidor

## Arquivo Pronto para Download

✅ **iaverse-servidor.tar.gz** (45KB) - Pacote completo para instalação

### Conteúdo do Pacote:
- `index.js` - Servidor backend completo
- `index.html` - Interface web responsiva  
- `package.json` - Dependências de produção
- `.env.example` - Modelo de configuração
- `install.sh` - Script de instalação automática
- `assets/` - Recursos estáticos

## Opção 1: Instalação Automática (Recomendado)

```bash
# 1. Fazer download do arquivo
wget http://localhost:5000/iaverse-servidor.tar.gz

# 2. Extrair arquivos
tar -xzf iaverse-servidor.tar.gz

# 3. Executar instalação automática
sudo ./install.sh
```

O script instala automaticamente:
- Node.js 20
- PostgreSQL
- Nginx (proxy reverso)
- PM2 (gerenciador de processos)
- Configura banco de dados
- Inicia a aplicação

## Opção 2: Instalação Manual

```bash
# 1. Extrair arquivos
tar -xzf iaverse-servidor.tar.gz
cd iaverse-deploy/

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar dependências
npm install --production

# 4. Configurar variáveis
cp .env.example .env
nano .env  # Editar configurações

# 5. Iniciar aplicação
node index.js
```

## Configuração Mínima (.env)

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/iaverse
SESSION_SECRET=sua_chave_secreta_32_caracteres_minimo
```

## Como Baixar o Arquivo

### Via navegador:
- Acesse: `http://localhost:5000/iaverse-servidor.tar.gz`
- O download iniciará automaticamente

### Via linha de comando:
```bash
curl -O http://localhost:5000/iaverse-servidor.tar.gz
```

### Via wget:
```bash
wget http://localhost:5000/iaverse-servidor.tar.gz
```

## Verificação Pós-Instalação

```bash
# Testar API
curl http://seu-servidor:3000/api/health

# Verificar logs
pm2 logs iaverse

# Status da aplicação  
pm2 status
```

## Requisitos Mínimos do Servidor

- **CPU:** 1 vCore
- **RAM:** 1GB
- **Armazenamento:** 5GB
- **Sistema:** Ubuntu 20.04+ / CentOS 7+
- **Rede:** Porta 80/443 abertas

## Suporte

- Health check: `/api/health`
- Logs: `pm2 logs iaverse`
- Reiniciar: `pm2 restart iaverse`
- Parar: `pm2 stop iaverse`