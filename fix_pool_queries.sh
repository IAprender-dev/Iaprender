#!/bin/bash

# Script para corrigir todas as chamadas pool.query diretas no arquivo diretor-crud.ts
# adicionando manejo adequado de conexão

FILE="server/routes/diretor-crud.ts"

# Backup do arquivo original
cp "$FILE" "${FILE}.backup"

# Corrigir as chamadas pool.query restantes
sed -i '
# Localizar linhas com pool.query e adicionar manejo de conexão antes delas
/const emailExistente = await pool\.query(/i\
    const client = await pool.connect();\
    let emailExistente, novoUsuarioQuery, novoProfessorQuery;

/const novoUsuarioQuery = await pool\.query(/c\
      novoUsuarioQuery = await client.query(

/const novoProfessorQuery = await pool\.query(/c\
      novoProfessorQuery = await client.query(

/const alunoExistente = await pool\.query(/i\
    const client = await pool.connect();\
    let alunoExistente, alunoAtualizadoQuery;

/const alunoAtualizadoQuery = await pool\.query(/c\
      alunoAtualizadoQuery = await client.query(

/await pool\.query(/i\
    const client = await pool.connect();\
    try {

/await pool\.query(/c\
      await client.query(
' "$FILE"

# Adicionar finally blocks onde necessário
sed -i '
# Adicionar finally block após queries
/novoUsuarioQuery = await client\.query(/a\
    } finally {\
      client.release();\
    }

/alunoAtualizadoQuery = await client\.query(/a\
    } finally {\
      client.release();\
    }

/await client\.query(/a\
    } finally {\
      client.release();\
    }
' "$FILE"

echo "Correções aplicadas em $FILE"
echo "Backup salvo em ${FILE}.backup"