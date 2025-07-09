/**
 * TESTE DIRETO DE AUTENTICAÇÃO
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';

console.log('🧪 Teste direto de autenticação...');

// Criar token
const payload = {
  id: 1,
  email: 'admin@iaprender.com.br',
  tipo_usuario: 'admin',
  empresa_id: 1
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

console.log('Token:', token);
console.log('Payload:', payload);

// Testar direto
async function testar() {
  try {
    console.log('\n🔥 Testando GET /api/auth/me...');
    
    const response = await axios.get(`${API_BASE}/api/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Sucesso!');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.log('❌ Erro:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('Error:', error.response?.data?.error);
    console.log('Headers enviados:', error.config?.headers);
  }
}

testar();