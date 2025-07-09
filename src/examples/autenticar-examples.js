import express from 'express';
import { autenticar, authorize, authorizeGroups, authorizeCompany } from '../middleware/auth.js';

const app = express();
app.use(express.json());

// EXEMPLO 1: Rota simples com middleware autenticar
app.get('/api/perfil', autenticar, (req, res) => {
  res.json({
    message: 'Perfil do usuário autenticado',
    user: {
      id: req.user.id,
      nome: req.user.nome,
      email: req.user.email,
      tipo_usuario: req.user.tipo_usuario,
      empresa_id: req.user.empresa_id,
      groups: req.user.groups
    }
  });
});

// EXEMPLO 2: Rota com autenticação + autorização por tipo
app.get('/api/admin/usuarios', 
  autenticar, 
  authorize(['admin']), 
  (req, res) => {
    res.json({
      message: 'Lista de usuários (apenas admins)',
      user_tipo: req.user.tipo_usuario,
      usuarios: []
    });
  }
);

// EXEMPLO 3: Rota com autenticação + autorização por grupos
app.get('/api/gestores/dashboard', 
  autenticar, 
  authorizeGroups(['Gestores', 'GestorMunicipal']), 
  (req, res) => {
    res.json({
      message: 'Dashboard do gestor',
      user: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario,
        empresa_id: req.user.empresa_id,
        groups: req.user.groups
      }
    });
  }
);

// EXEMPLO 4: Rota com autenticação + autorização por empresa
app.get('/api/empresa/:empresa_id/dados', 
  autenticar, 
  authorize(['admin', 'gestor']), 
  authorizeCompany, 
  (req, res) => {
    res.json({
      message: 'Dados da empresa',
      empresa_id: req.params.empresa_id,
      user_empresa_id: req.user.empresa_id,
      user_nome: req.user.nome
    });
  }
);

// EXEMPLO 5: Rota POST com autenticação
app.post('/api/usuarios', 
  autenticar, 
  authorize(['admin', 'gestor']), 
  (req, res) => {
    res.json({
      message: 'Usuário criado com sucesso',
      created_by: req.user.nome,
      user_data: req.body
    });
  }
);

// EXEMPLO 6: Rota PUT com autenticação
app.put('/api/usuarios/:id', 
  autenticar, 
  authorize(['admin', 'gestor']), 
  (req, res) => {
    res.json({
      message: 'Usuário atualizado com sucesso',
      updated_by: req.user.nome,
      user_id: req.params.id,
      user_data: req.body
    });
  }
);

// EXEMPLO 7: Rota DELETE com autenticação
app.delete('/api/usuarios/:id', 
  autenticar, 
  authorize(['admin']), 
  (req, res) => {
    res.json({
      message: 'Usuário deletado com sucesso',
      deleted_by: req.user.nome,
      user_id: req.params.id
    });
  }
);

// EXEMPLO 8: Rota que mostra dados específicos do token
app.get('/api/token-info', autenticar, (req, res) => {
  const now = Math.floor(Date.now() / 1000);
  const timeToExpiry = req.user.exp - now;
  
  res.json({
    message: 'Informações do token',
    token_data: {
      sub: req.user.sub,
      issued_at: new Date(req.user.iat * 1000).toISOString(),
      expires_at: new Date(req.user.exp * 1000).toISOString(),
      expires_in_seconds: timeToExpiry,
      expires_in_minutes: Math.floor(timeToExpiry / 60),
      groups: req.user.groups,
      empresa_id: req.user.empresa_id
    }
  });
});

// EXEMPLO 9: Rota específica para diretores
app.get('/api/escola/:escola_id/turmas', 
  autenticar, 
  authorize(['admin', 'gestor', 'diretor']), 
  async (req, res) => {
    // Verificação adicional para diretores
    if (req.user.tipo_usuario === 'diretor') {
      try {
        const escolaId = parseInt(req.params.escola_id);
        
        // Aqui você faria a verificação no banco se o diretor tem acesso à escola
        // const hasAccess = await verificarAcessoEscola(req.user.id, escolaId);
        
        console.log(`Diretor ${req.user.nome} acessando escola ${escolaId}`);
      } catch (error) {
        return res.status(403).json({
          message: 'Acesso negado à escola',
          error: 'SCHOOL_ACCESS_DENIED'
        });
      }
    }
    
    res.json({
      message: 'Turmas da escola',
      escola_id: req.params.escola_id,
      accessed_by: req.user.nome,
      user_type: req.user.tipo_usuario,
      turmas: []
    });
  }
);

// EXEMPLO 10: Rota específica para professores
app.get('/api/professor/minhas-turmas', 
  autenticar, 
  authorize(['professor']), 
  (req, res) => {
    res.json({
      message: 'Turmas do professor',
      professor: {
        id: req.user.id,
        nome: req.user.nome,
        email: req.user.email,
        empresa_id: req.user.empresa_id
      },
      turmas: []
    });
  }
);

// EXEMPLO 11: Rota específica para alunos
app.get('/api/aluno/minhas-notas', 
  autenticar, 
  authorize(['aluno']), 
  (req, res) => {
    res.json({
      message: 'Notas do aluno',
      aluno: {
        id: req.user.id,
        nome: req.user.nome,
        email: req.user.email,
        empresa_id: req.user.empresa_id
      },
      notas: []
    });
  }
);

// EXEMPLO 12: Rota que funciona para múltiplos tipos de usuário
app.get('/api/notificacoes', 
  autenticar, 
  authorize(['admin', 'gestor', 'diretor', 'professor', 'aluno']), 
  (req, res) => {
    res.json({
      message: 'Notificações do usuário',
      user: {
        id: req.user.id,
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario
      },
      notificacoes: []
    });
  }
);

// EXEMPLO 13: Middleware de tratamento de erros personalizado
app.use((err, req, res, next) => {
  console.error('❌ Erro na aplicação:', err.message);
  
  // Erros específicos de autenticação
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token JWT inválido',
      error: 'INVALID_JWT'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expirado',
      error: 'EXPIRED_TOKEN'
    });
  }
  
  // Erro genérico
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: 'INTERNAL_SERVER_ERROR'
  });
});

// EXEMPLO 14: Função para testar o middleware
export async function testarMiddlewareAutenticar() {
  console.log('🧪 Testando middleware autenticar...');
  
  // Simular requisição com token válido
  const reqValido = {
    headers: {
      'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  };
  
  const res = {
    status: (code) => ({
      json: (data) => {
        console.log(`Status: ${code}`);
        console.log('Response:', data);
      }
    })
  };
  
  const next = () => {
    console.log('✅ Middleware passou, chamando next()');
  };
  
  try {
    await autenticar(reqValido, res, next);
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// EXEMPLO 15: Função para testar diferentes cenários
export async function testarCenarios() {
  console.log('🧪 Testando diferentes cenários...');
  
  const cenarios = [
    {
      nome: 'Sem token',
      headers: {}
    },
    {
      nome: 'Token inválido',
      headers: { 'authorization': 'Bearer token.invalido' }
    },
    {
      nome: 'Sem Bearer',
      headers: { 'authorization': 'token.sem.bearer' }
    },
    {
      nome: 'Token válido',
      headers: { 'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' }
    }
  ];
  
  for (const cenario of cenarios) {
    console.log(`\n🔍 Testando cenário: ${cenario.nome}`);
    
    const req = { headers: cenario.headers };
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`   Status: ${code}`);
          console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
        }
      })
    };
    const next = () => console.log('   ✅ Next() chamado');
    
    try {
      await autenticar(req, res, next);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
}

export default app;