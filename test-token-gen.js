import jwt from 'jsonwebtoken';

// Criar token JWT válido para teste
const payload = {
  id: 1,
  email: "teste@exemplo.com",
  tipo_usuario: "admin",
  empresa_id: 1,
  escola_id: null,
  cognito_sub: "test-sub",
  groups: ["Admin"]
};

const secret = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('Token JWT válido:');
console.log(token);