/**
 * TESTE DO SISTEMA DE AUTENTICAÇÃO DIRETA COGNITO
 * 
 * Este script testa a autenticação direta com AWS Cognito sem duplicação de dados
 */

async function testarAutenticacaoCognito() {
  console.log('🔐 Iniciando teste de autenticação direta Cognito...');
  
  // Teste 1: Verificar status da autenticação direta
  console.log('\n📊 Teste 1: Verificando status da autenticação direta...');
  try {
    const response = await fetch('http://localhost:5000/api/auth/direct-status');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(data, null, 2));
    
    if (data.configured) {
      console.log('✅ Autenticação direta configurada e disponível');
    } else {
      console.log('❌ Autenticação direta não configurada');
      return;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return;
  }
  
  // Teste 2: Tentar login com usuário inexistente
  console.log('\n📊 Teste 2: Tentando login com usuário inexistente...');
  try {
    const response = await fetch('http://localhost:5000/api/auth/direct-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'usuario.inexistente@example.com',
        password: 'senha123',
      }),
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Usuário inexistente rejeitado corretamente');
    } else {
      console.log('❌ Comportamento inesperado para usuário inexistente');
    }
  } catch (error) {
    console.error('❌ Erro no teste de usuário inexistente:', error);
  }
  
  // Teste 3: Tentar login com senha incorreta
  console.log('\n📊 Teste 3: Tentando login com senha incorreta...');
  try {
    const response = await fetch('http://localhost:5000/api/auth/direct-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'senha_incorreta',
      }),
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Senha incorreta rejeitada corretamente');
    } else {
      console.log('❌ Comportamento inesperado para senha incorreta');
    }
  } catch (error) {
    console.error('❌ Erro no teste de senha incorreta:', error);
  }
  
  // Teste 4: Tentar login com dados válidos (se houver)
  console.log('\n📊 Teste 4: Tentando login com dados válidos...');
  
  const testCredentials = [
    { email: 'admin@example.com', password: 'AdminTest123!' },
    { email: 'gestor@example.com', password: 'GestorTest123!' },
    { email: 'diretor@example.com', password: 'DiretorTest123!' },
  ];
  
  for (const credentials of testCredentials) {
    try {
      console.log(`\n🔍 Testando login com: ${credentials.email}`);
      
      const response = await fetch('http://localhost:5000/api/auth/direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      
      console.log('Status:', response.status);
      console.log('Resposta:', JSON.stringify(data, null, 2));
      
      if (response.status === 200 && data.success) {
        console.log(`✅ Login bem-sucedido para: ${credentials.email}`);
        
        // Teste 5: Usar o token para acessar endpoint protegido
        console.log('\n📊 Teste 5: Testando acesso a endpoint protegido...');
        
        const token = data.tokens.idToken;
        const meResponse = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const meData = await meResponse.json();
        
        console.log('Status /me:', meResponse.status);
        console.log('Resposta /me:', JSON.stringify(meData, null, 2));
        
        if (meResponse.status === 200 && meData.success) {
          console.log('✅ Acesso a endpoint protegido bem-sucedido');
          console.log('📊 Informações do usuário:', meData.user);
        } else {
          console.log('❌ Falha ao acessar endpoint protegido');
        }
        
        // Parar no primeiro login bem-sucedido
        break;
      } else {
        console.log(`❌ Login falhado para: ${credentials.email}`);
      }
    } catch (error) {
      console.error(`❌ Erro no login para ${credentials.email}:`, error);
    }
  }
  
  console.log('\n🏁 Teste de autenticação direta Cognito concluído!');
}

// Executar teste
testarAutenticacaoCognito().catch(console.error);