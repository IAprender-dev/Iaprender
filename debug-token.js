/**
 * DEBUG DO TOKEN JWT
 * Script para debugar problema de autenticação
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';

console.log('🔍 Debugando sistema de tokens...\n');

// Criar token de teste
const payload = {
  id: 1,
  email: 'admin@iaprender.com.br',
  tipo_usuario: 'admin',
  empresa_id: 1
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

console.log('📝 Token criado:');
console.log(token);
console.log('\n📋 Payload original:');
console.log(JSON.stringify(payload, null, 2));

// Verificar token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('\n✅ Token decodificado com sucesso:');
  console.log(JSON.stringify(decoded, null, 2));
} catch (error) {
  console.log('\n❌ Erro ao decodificar token:', error.message);
}

console.log('\n🔑 JWT_SECRET em uso:', JWT_SECRET);
console.log('🔑 Comprimento do secret:', JWT_SECRET.length);

// Testar diferentes secrets
const alternativeSecrets = [
  'test_secret_key_iaprender_2025',
  process.env.JWT_SECRET,
  'default_secret'
];

console.log('\n🧪 Testando diferentes secrets:');
for (const secret of alternativeSecrets) {
  if (!secret) continue;
  
  try {
    const testDecoded = jwt.verify(token, secret);
    console.log(`✅ Secret "${secret.substring(0, 20)}..." FUNCIONA`);
  } catch (error) {
    console.log(`❌ Secret "${secret.substring(0, 20)}..." falha: ${error.message}`);
  }
}