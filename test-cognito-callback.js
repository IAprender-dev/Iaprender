/**
 * TESTE DO CALLBACK DO COGNITO
 * Script para testar o processamento do callback e redirecionamento
 */

import jwt from 'jsonwebtoken';

// Simular um token JWT do Cognito para teste
function createTestToken(userType = 'Gestores') {
  const payload = {
    sub: 'test-user-123',
    email: 'test@example.com',
    'cognito:groups': [userType],
    name: 'Usuário Teste',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  // Usar um secret temporário para teste
  return jwt.sign(payload, 'test-secret');
}

// Testar diferentes tipos de usuário
const testCases = [
  { group: 'Admin', expectedPath: '/admin/master' },
  { group: 'Gestores', expectedPath: '/gestor/dashboard' },
  { group: 'Diretores', expectedPath: '/school/dashboard' },
  { group: 'Professores', expectedPath: '/teacher/dashboard' },
  { group: 'Alunos', expectedPath: '/student/dashboard' }
];

console.log('🔄 Testando tokens JWT e redirecionamento...\n');

testCases.forEach(testCase => {
  const token = createTestToken(testCase.group);
  const decoded = jwt.decode(token);
  
  console.log(`Grupo: ${testCase.group}`);
  console.log(`Token criado: ${token.substring(0, 50)}...`);
  console.log(`Grupos no token: ${JSON.stringify(decoded['cognito:groups'])}`);
  console.log(`Redirecionamento esperado: ${testCase.expectedPath}`);
  console.log('---');
});

console.log('\n✅ Teste de tokens concluído. Use estes tokens para testar o callback manualmente.');