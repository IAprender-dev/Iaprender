#!/usr/bin/env node

/**
 * Script para gerar JWT Secret seguro
 * Execução: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

console.log('🔐 Gerador de JWT Secret Seguro\n');

// Gerar secret de 32 bytes (256 bits)
const secret = crypto.randomBytes(32).toString('base64');

console.log('📋 Seu novo JWT Secret:');
console.log('─'.repeat(50));
console.log(secret);
console.log('─'.repeat(50));

console.log('\n📝 Instruções:');
console.log('1. Copie o secret acima');
console.log('2. Adicione no seu arquivo .env:');
console.log(`   JWT_SECRET=${secret}`);
console.log('\n⚠️  IMPORTANTE:');
console.log('- NUNCA compartilhe este secret');
console.log('- NUNCA commite no git');
console.log('- Use um secret diferente para cada ambiente');
console.log('- Rotacione periodicamente em produção');

// Verificar força do secret
console.log('\n✅ Validação:');
console.log(`- Comprimento: ${secret.length} caracteres`);
console.log(`- Entropia: ${Buffer.from(secret, 'base64').length * 8} bits`);
console.log('- Status: SEGURO');