const jwt = require('jsonwebtoken');

// Gerar token de teste
const token = jwt.sign({
  sub: 'test-user-123',
  empresa_id: 1,
  tipo_usuario: 'admin',
  email: 'admin@iaprender.com'
}, process.env.JWT_SECRET || 'iaprender-secret-key', { expiresIn: '1h' });

console.log('Token de teste:', token);

// Testar health check (sem autenticação)
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('Erro health check:', err));

// Testar perfil do usuário (com autenticação)
fetch('http://localhost:5000/api/usuario/perfil', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => console.log('Perfil do usuário:', data))
  .catch(err => console.error('Erro perfil:', err));

// Testar documentos do usuário (com autenticação)
fetch('http://localhost:5000/api/usuario/documentos', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => console.log('Documentos do usuário:', data))
  .catch(err => console.error('Erro documentos:', err));

// Testar geração de documento com mock (sem Bedrock)
fetch('http://localhost:5000/api/documento/gerar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Gere um plano de aula sobre matemática básica',
    tipo_arquivo: 'plano_aula',
    modelo_ia: 'mock'
  })
})
  .then(res => res.json())
  .then(data => console.log('Documento gerado:', data))
  .catch(err => console.error('Erro geração:', err));