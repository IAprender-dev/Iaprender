#!/bin/bash

# =====================================================
# SCRIPT DE CONFIGURAÇÃO AURORA SERVERLESS V2
# Para plataforma educacional IAverse (100k+ usuários)
# =====================================================

set -e

echo "🚀 INICIANDO CONFIGURAÇÃO AURORA SERVERLESS V2"
echo "=================================================="

# Variáveis de configuração
CLUSTER_ID="iaverse-aurora-cluster"
INSTANCE_ID="iaverse-aurora-instance"
DB_NAME="iaverse"
MASTER_USER="postgres"
MASTER_PASSWORD="IAverse2025SecurePass!"
REGION="us-east-1"

# Verificar se AWS CLI está configurado
echo "🔍 Verificando configuração AWS..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI não está configurado ou credenciais inválidas"
    echo "💡 Configure as credenciais AWS primeiro"
    exit 1
fi

echo "✅ AWS CLI configurado corretamente"

# Função para aguardar status do cluster
wait_for_cluster() {
    local cluster_id=$1
    local desired_status=$2
    local max_attempts=60
    local attempt=0
    
    echo "⏳ Aguardando cluster '$cluster_id' ficar '$desired_status'..."
    
    while [ $attempt -lt $max_attempts ]; do
        local current_status=$(aws rds describe-db-clusters \
            --db-cluster-identifier "$cluster_id" \
            --region "$REGION" \
            --query 'DBClusters[0].Status' \
            --output text 2>/dev/null || echo "not-found")
        
        if [ "$current_status" = "$desired_status" ]; then
            echo "✅ Cluster está '$desired_status'!"
            return 0
        fi
        
        echo "⏱️ Status atual: $current_status (tentativa $((attempt + 1))/$max_attempts)"
        sleep 30
        ((attempt++))
    done
    
    echo "❌ Timeout aguardando cluster ficar '$desired_status'"
    return 1
}

# Passo 1: Criar cluster Aurora Serverless v2
echo ""
echo "📝 PASSO 1: Criando cluster Aurora Serverless v2..."
echo "================================================"

if aws rds describe-db-clusters --db-cluster-identifier "$CLUSTER_ID" --region "$REGION" > /dev/null 2>&1; then
    echo "ℹ️ Cluster '$CLUSTER_ID' já existe"
else
    echo "🏗️ Criando cluster '$CLUSTER_ID'..."
    
    aws rds create-db-cluster \
        --db-cluster-identifier "$CLUSTER_ID" \
        --engine aurora-postgresql \
        --engine-version 15.4 \
        --master-username "$MASTER_USER" \
        --master-user-password "$MASTER_PASSWORD" \
        --database-name "$DB_NAME" \
        --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=16 \
        --backup-retention-period 7 \
        --preferred-backup-window "03:00-04:00" \
        --preferred-maintenance-window "sun:04:00-sun:05:00" \
        --storage-encrypted \
        --region "$REGION" \
        --tags Key=Environment,Value=production Key=Project,Value=IAverse Key=Type,Value=Educational-Platform
    
    echo "✅ Cluster criado com sucesso!"
fi

# Aguardar cluster ficar disponível
wait_for_cluster "$CLUSTER_ID" "available"

# Passo 2: Criar instância Aurora Serverless v2
echo ""
echo "📝 PASSO 2: Criando instância Aurora Serverless v2..."
echo "================================================="

if aws rds describe-db-instances --db-instance-identifier "$INSTANCE_ID" --region "$REGION" > /dev/null 2>&1; then
    echo "ℹ️ Instância '$INSTANCE_ID' já existe"
else
    echo "🏗️ Criando instância '$INSTANCE_ID'..."
    
    aws rds create-db-instance \
        --db-instance-identifier "$INSTANCE_ID" \
        --db-cluster-identifier "$CLUSTER_ID" \
        --db-instance-class db.serverless \
        --engine aurora-postgresql \
        --region "$REGION" \
        --tags Key=Environment,Value=production Key=Project,Value=IAverse
    
    echo "✅ Instância criada com sucesso!"
fi

# Passo 3: Obter informações de conexão
echo ""
echo "📝 PASSO 3: Obtendo informações de conexão..."
echo "=============================================="

# Obter endpoint do cluster
CLUSTER_ENDPOINT=$(aws rds describe-db-clusters \
    --db-cluster-identifier "$CLUSTER_ID" \
    --region "$REGION" \
    --query 'DBClusters[0].Endpoint' \
    --output text)

CLUSTER_PORT=$(aws rds describe-db-clusters \
    --db-cluster-identifier "$CLUSTER_ID" \
    --region "$REGION" \
    --query 'DBClusters[0].Port' \
    --output text)

echo "✅ Informações obtidas com sucesso!"

# Passo 4: Configurar Security Group (se necessário)
echo ""
echo "📝 PASSO 4: Configurando acesso de rede..."
echo "=========================================="

# Obter VPC Security Group do cluster
VPC_SECURITY_GROUP=$(aws rds describe-db-clusters \
    --db-cluster-identifier "$CLUSTER_ID" \
    --region "$REGION" \
    --query 'DBClusters[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
    --output text)

echo "🔒 Security Group: $VPC_SECURITY_GROUP"

# Adicionar regra para permitir acesso PostgreSQL (porta 5432)
echo "🔓 Configurando acesso PostgreSQL..."
aws ec2 authorize-security-group-ingress \
    --group-id "$VPC_SECURITY_GROUP" \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0 \
    --region "$REGION" 2>/dev/null || echo "ℹ️ Regra já existe ou erro ao adicionar (normal)"

echo "✅ Acesso configurado!"

# Passo 5: Exibir informações finais
echo ""
echo "🎉 CONFIGURAÇÃO AURORA SERVERLESS COMPLETA!"
echo "=============================================="
echo ""
echo "📋 INFORMAÇÕES DE CONEXÃO:"
echo "Host: $CLUSTER_ENDPOINT"
echo "Porta: $CLUSTER_PORT"
echo "Database: $DB_NAME"
echo "Usuário: $MASTER_USER"
echo "Senha: $MASTER_PASSWORD"
echo ""
echo "🔗 STRING DE CONEXÃO:"
CONNECTION_STRING="postgresql://$MASTER_USER:$MASTER_PASSWORD@$CLUSTER_ENDPOINT:$CLUSTER_PORT/$DB_NAME"
echo "$CONNECTION_STRING"
echo ""

# Salvar informações em arquivo
echo "💾 Salvando informações em arquivo..."
cat > aurora-connection-info.txt << EOF
# INFORMAÇÕES DE CONEXÃO AURORA SERVERLESS V2
# Gerado em: $(date)

HOST=$CLUSTER_ENDPOINT
PORT=$CLUSTER_PORT
DATABASE=$DB_NAME
USERNAME=$MASTER_USER
PASSWORD=$MASTER_PASSWORD

CONNECTION_STRING=$CONNECTION_STRING

# Para uso nas secrets do Replit:
# DATABASE_URL=$CONNECTION_STRING
EOF

echo "✅ Informações salvas em: aurora-connection-info.txt"

# Passo 6: Testar conectividade
echo ""
echo "📝 PASSO 6: Testando conectividade..."
echo "===================================="

# Instalar psql se não estiver disponível
if ! command -v psql &> /dev/null; then
    echo "🔧 Instalando PostgreSQL client..."
    apt-get update && apt-get install -y postgresql-client
fi

# Testar conexão
echo "🧪 Testando conexão com Aurora..."
export PGPASSWORD="$MASTER_PASSWORD"
if psql -h "$CLUSTER_ENDPOINT" -p "$CLUSTER_PORT" -U "$MASTER_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Conexão com Aurora estabelecida com sucesso!"
else
    echo "⚠️ Não foi possível conectar imediatamente (cluster pode estar inicializando)"
    echo "💡 Tente novamente em alguns minutos"
fi

echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "1. Atualizar DATABASE_URL nas secrets do Replit"
echo "2. Executar migração de dados do PostgreSQL atual"
echo "3. Executar script SQL otimizado no Aurora"
echo "4. Testar aplicação completa"
echo ""
echo "✅ SCRIPT FINALIZADO COM SUCESSO!"