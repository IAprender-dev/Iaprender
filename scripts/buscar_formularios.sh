#!/bin/bash

# Script para buscar e catalogar formulários no projeto IAprender

echo "🔍 BUSCANDO FORMULÁRIOS NO PROJETO IAPRENDER..."
echo "================================================"

# Criar arquivo de saída
OUTPUT_FILE="formularios_encontrados.txt"
echo "# FORMULÁRIOS ENCONTRADOS - $(date)" > $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# 1. Buscar arquivos com useForm
echo "📝 Buscando arquivos com useForm..."
echo "## ARQUIVOS COM useForm:" >> $OUTPUT_FILE
find ./client -name "*.tsx" -o -name "*.ts" | xargs grep -l "useForm" | while read file; do
    echo "- $file" >> $OUTPUT_FILE
    echo "  $(grep -n "useForm" "$file" | head -1 | cut -d: -f2 | xargs)" >> $OUTPUT_FILE
done
echo "" >> $OUTPUT_FILE

# 2. Buscar arquivos com Form components
echo "📋 Buscando componentes Form..."
echo "## COMPONENTES FORM:" >> $OUTPUT_FILE
find ./client -name "*.tsx" -o -name "*.ts" | xargs grep -l "<Form\|FormField\|FormContainer" | while read file; do
    echo "- $file" >> $OUTPUT_FILE
done
echo "" >> $OUTPUT_FILE

# 3. Buscar schemas de validação
echo "🔍 Buscando schemas de validação..."
echo "## SCHEMAS DE VALIDAÇÃO:" >> $OUTPUT_FILE
find ./client -name "*.tsx" -o -name "*.ts" | xargs grep -l "Schema\|zodResolver\|z\." | while read file; do
    echo "- $file" >> $OUTPUT_FILE
done
echo "" >> $OUTPUT_FILE

# 4. Buscar formulários de cadastro/criação
echo "➕ Buscando formulários de cadastro..."
echo "## FORMULÁRIOS DE CADASTRO/CRIAÇÃO:" >> $OUTPUT_FILE
find ./client -name "*.tsx" -o -name "*.ts" | xargs grep -l "Create.*Form\|cadastro\|registro" | while read file; do
    echo "- $file" >> $OUTPUT_FILE
done
echo "" >> $OUTPUT_FILE

# 5. Buscar mutações relacionadas a formulários
echo "🔄 Buscando mutações de formulário..."
echo "## MUTAÇÕES DE FORMULÁRIO:" >> $OUTPUT_FILE
find ./client -name "*.tsx" -o -name "*.ts" | xargs grep -l "useMutation\|mutate\|\.post\|\.put\|\.patch" | while read file; do
    echo "- $file" >> $OUTPUT_FILE
done
echo "" >> $OUTPUT_FILE

echo "✅ Busca concluída! Resultados salvos em $OUTPUT_FILE"
cat $OUTPUT_FILE