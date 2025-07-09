#!/usr/bin/env node

/**
 * Script para testar integração com AWS Cognito
 * Verifica se conseguimos acessar usuários e grupos reais
 */

import CognitoService from '../config/cognito.js';
import logger from '../utils/logger.js';

async function testarIntegracaoCognito() {
  console.log('🚀 Iniciando teste de integração AWS Cognito\n');
  
  const cognitoService = new CognitoService();
  
  try {
    // 1. Verificar conectividade
    console.log('1️⃣ Verificando conectividade...');
    const conectado = await cognitoService.verificarConectividade();
    
    if (!conectado) {
      console.log('❌ Falha na conectividade com AWS Cognito');
      console.log('   Verifique as credenciais AWS no arquivo .env');
      return;
    }
    console.log('✅ Conectividade confirmada\n');
    
    // 2. Listar grupos disponíveis
    console.log('2️⃣ Listando grupos disponíveis...');
    const grupos = await cognitoService.listarGrupos();
    
    if (grupos.length === 0) {
      console.log('⚠️  Nenhum grupo encontrado no User Pool');
    } else {
      console.log(`✅ ${grupos.length} grupos encontrados:`);
      grupos.forEach(grupo => {
        console.log(`   📋 ${grupo.GroupName} (precedência: ${grupo.Precedence || 0})`);
        if (grupo.Description) {
          console.log(`      📝 ${grupo.Description}`);
        }
      });
    }
    console.log('');
    
    // 3. Listar usuários com grupos
    console.log('3️⃣ Listando usuários com grupos...');
    const resultado = await cognitoService.listarUsuarios(10); // Limitar a 10 para teste
    
    if (resultado.usuarios.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado no User Pool');
    } else {
      console.log(`✅ ${resultado.usuarios.length} usuários encontrados:\n`);
      
      resultado.usuarios.forEach((user, index) => {
        const emailAttr = user.Attributes?.find(attr => attr.Name === 'email');
        const email = emailAttr?.Value || 'N/A';
        
        console.log(`   ${index + 1}. 👤 ${user.Username}`);
        console.log(`      📧 Email: ${email}`);
        console.log(`      📊 Status: ${user.UserStatus}`);
        console.log(`      📅 Criado: ${new Date(user.UserCreateDate).toLocaleDateString('pt-BR')}`);
        
        if (user.Groups && user.Groups.length > 0) {
          console.log(`      👥 Grupos: ${user.Groups.map(g => g.GroupName).join(', ')}`);
        } else {
          console.log(`      👥 Grupos: Nenhum grupo atribuído`);
        }
        
        // Mapear para tipo de usuário local
        const dadosMapeados = cognitoService.mapearUsuarioCognito(user);
        console.log(`      🏷️  Tipo Local: ${dadosMapeados.tipo_usuario.toUpperCase()}`);
        console.log(`      🏢 Empresa ID: ${dadosMapeados.empresa_id || 'N/A'}`);
        console.log('');
      });
    }
    
    // 4. Resumo do mapeamento de grupos
    console.log('4️⃣ Mapeamento de grupos configurado:');
    Object.entries(cognitoService.groupMappings).forEach(([grupo, tipo]) => {
      console.log(`   ${grupo} → ${tipo.toUpperCase()}`);
    });
    console.log('');
    
    // 5. Estatísticas finais
    console.log('📊 RESUMO DA INTEGRAÇÃO:');
    console.log(`   • User Pool ID: ${cognitoService.userPoolId}`);
    console.log(`   • Total de grupos: ${grupos.length}`);
    console.log(`   • Total de usuários: ${resultado.usuarios.length}`);
    console.log(`   • Conectividade: ${conectado ? 'OK' : 'FALHA'}`);
    console.log(`   • Timestamp: ${new Date().toLocaleString('pt-BR')}`);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('   Detalhes:', error);
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testarIntegracaoCognito()
    .then(() => {
      console.log('\n✅ Teste concluído');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erro fatal:', error.message);
      process.exit(1);
    });
}

export default testarIntegracaoCognito;