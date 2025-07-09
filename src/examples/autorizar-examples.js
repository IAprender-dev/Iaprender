import express from 'express';
import { autenticar } from '../middleware/auth.js';
import { 
  verificarEmpresa,
  verificarEmpresaContrato,
  verificarEmpresaEscola,
  verificarEmpresaGestor,
  verificarEmpresaDiretor,
  verificarEmpresaProfessor,
  verificarEmpresaAluno,
  verificarAcessoEmpresa,
  verificarGestaoEmpresa,
  filtrarPorEmpresa,
  aplicarFiltroEmpresa,
  auditarAcessoEmpresa
} from '../middleware/autorizar.js';

const app = express();
app.use(express.json());

// EXEMPLO 1: Rota para listar contratos (apenas da empresa do usuário)
app.get('/api/contratos', 
  autenticar, 
  verificarAcessoEmpresa,
  filtrarPorEmpresa(),
  async (req, res) => {
    try {
      // Aplicar filtro de empresa na consulta
      let query = 'SELECT * FROM contratos ORDER BY id';
      let params = [];
      
      const filtrado = aplicarFiltroEmpresa(query, params, req.filtroEmpresa);
      
      console.log('🔍 Query:', filtrado.query);
      console.log('🔍 Params:', filtrado.params);
      
      // const result = await executeQuery(filtrado.query, filtrado.params);
      
      res.json({
        message: 'Contratos da empresa',
        filtro_empresa: req.filtroEmpresa,
        user_tipo: req.user.tipo_usuario,
        // contratos: result.rows
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar contratos', error: error.message });
    }
  }
);

// EXEMPLO 2: Rota para ver contrato específico (verificação de empresa)
app.get('/api/contratos/:id', 
  autenticar, 
  verificarEmpresaContrato,
  auditarAcessoEmpresa('VISUALIZAR_CONTRATO'),
  (req, res) => {
    res.json({
      message: 'Contrato autorizado',
      contrato_id: req.params.id,
      user: {
        nome: req.user.nome,
        empresa_id: req.user.empresa_id,
        tipo_usuario: req.user.tipo_usuario
      }
    });
  }
);

// EXEMPLO 3: Rota para atualizar contrato (apenas gestores e admins)
app.put('/api/contratos/:id', 
  autenticar,
  (req, res, next) => {
    // Verificação adicional de tipo de usuário
    if (!['admin', 'gestor'].includes(req.user.tipo_usuario)) {
      return res.status(403).json({
        message: 'Apenas admins e gestores podem atualizar contratos',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  },
  verificarEmpresaContrato,
  auditarAcessoEmpresa('ATUALIZAR_CONTRATO'),
  (req, res) => {
    res.json({
      message: 'Contrato atualizado com sucesso',
      contrato_id: req.params.id,
      updated_by: req.user.nome,
      data: req.body
    });
  }
);

// EXEMPLO 4: Rota para listar escolas (filtradas por empresa)
app.get('/api/escolas', 
  autenticar, 
  filtrarPorEmpresa(),
  async (req, res) => {
    try {
      let query = 'SELECT e.*, c.descricao as contrato_descricao FROM escolas e LEFT JOIN contratos c ON e.contrato_id = c.id';
      let params = [];
      
      const filtrado = aplicarFiltroEmpresa(query, params, req.filtroEmpresa, 'e.empresa_id');
      
      res.json({
        message: 'Escolas da empresa',
        query_info: {
          filtro_empresa: req.filtroEmpresa,
          user_tipo: req.user.tipo_usuario,
          query: filtrado.query
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar escolas', error: error.message });
    }
  }
);

// EXEMPLO 5: Rota para ver escola específica
app.get('/api/escolas/:escola_id', 
  autenticar, 
  verificarEmpresaEscola,
  auditarAcessoEmpresa('VISUALIZAR_ESCOLA'),
  (req, res) => {
    res.json({
      message: 'Escola autorizada',
      escola_id: req.params.escola_id,
      user: {
        nome: req.user.nome,
        empresa_id: req.user.empresa_id,
        tipo_usuario: req.user.tipo_usuario
      }
    });
  }
);

// EXEMPLO 6: Rota para criar novo diretor (verificação de empresa)
app.post('/api/diretores', 
  autenticar,
  verificarAcessoEmpresa,
  auditarAcessoEmpresa('CRIAR_DIRETOR'),
  (req, res) => {
    // Forçar empresa_id do diretor para ser a mesma do usuário criador
    const novoDiretor = {
      ...req.body,
      empresa_id: req.user.empresa_id,
      criado_por: req.user.id
    };
    
    res.json({
      message: 'Diretor criado com sucesso',
      diretor: novoDiretor,
      created_by: req.user.nome
    });
  }
);

// EXEMPLO 7: Rota para gerenciar empresa específica (apenas gestores da empresa ou admins)
app.get('/api/empresas/:empresa_id/gestao', 
  autenticar, 
  verificarGestaoEmpresa,
  auditarAcessoEmpresa('GERENCIAR_EMPRESA'),
  (req, res) => {
    res.json({
      message: 'Acesso autorizado para gestão da empresa',
      empresa_id: req.params.empresa_id,
      gestor: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario,
        empresa_id: req.user.empresa_id
      }
    });
  }
);

// EXEMPLO 8: Rota para listar gestores (com filtro de empresa)
app.get('/api/gestores', 
  autenticar, 
  filtrarPorEmpresa(),
  async (req, res) => {
    try {
      let query = 'SELECT g.*, u.email, e.nome as empresa_nome FROM gestores g LEFT JOIN usuarios u ON g.usr_id = u.id LEFT JOIN empresas e ON g.empresa_id = e.id';
      let params = [];
      
      const filtrado = aplicarFiltroEmpresa(query, params, req.filtroEmpresa, 'g.empresa_id');
      
      res.json({
        message: 'Gestores da empresa',
        filtro_aplicado: req.filtroEmpresa !== null,
        user_info: {
          nome: req.user.nome,
          tipo: req.user.tipo_usuario,
          empresa_id: req.user.empresa_id
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar gestores', error: error.message });
    }
  }
);

// EXEMPLO 9: Rota para ver detalhes de professor (verificação de empresa)
app.get('/api/professores/:id', 
  autenticar, 
  verificarEmpresaProfessor,
  auditarAcessoEmpresa('VISUALIZAR_PROFESSOR'),
  (req, res) => {
    res.json({
      message: 'Professor autorizado',
      professor_id: req.params.id,
      user: {
        nome: req.user.nome,
        empresa_id: req.user.empresa_id,
        tipo_usuario: req.user.tipo_usuario
      }
    });
  }
);

// EXEMPLO 10: Rota para listar alunos (filtrada por empresa e escola)
app.get('/api/escolas/:escola_id/alunos', 
  autenticar, 
  verificarEmpresaEscola, // Primeiro verifica se pode acessar a escola
  filtrarPorEmpresa(),
  async (req, res) => {
    try {
      let query = 'SELECT a.*, u.email FROM alunos a LEFT JOIN usuarios u ON a.usr_id = u.id WHERE a.escola_id = $1';
      let params = [req.params.escola_id];
      
      const filtrado = aplicarFiltroEmpresa(query, params, req.filtroEmpresa, 'a.empresa_id');
      
      res.json({
        message: 'Alunos da escola',
        escola_id: req.params.escola_id,
        filtro_empresa: req.filtroEmpresa,
        user_info: {
          nome: req.user.nome,
          tipo: req.user.tipo_usuario
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar alunos', error: error.message });
    }
  }
);

// EXEMPLO 11: Rota administrativa (apenas admins, sem filtro de empresa)
app.get('/api/admin/todas-empresas', 
  autenticar,
  (req, res, next) => {
    if (req.user.tipo_usuario !== 'admin') {
      return res.status(403).json({
        message: 'Acesso restrito a administradores',
        error: 'ADMIN_ONLY'
      });
    }
    next();
  },
  auditarAcessoEmpresa('LISTAR_TODAS_EMPRESAS'),
  (req, res) => {
    res.json({
      message: 'Todas as empresas do sistema (acesso admin)',
      admin: {
        nome: req.user.nome,
        tipo_usuario: req.user.tipo_usuario
      },
      empresas: [] // Aqui viria a consulta sem filtro
    });
  }
);

// EXEMPLO 12: Rota para relatórios (com filtro baseado no tipo de usuário)
app.get('/api/relatorios/usuarios', 
  autenticar,
  filtrarPorEmpresa(),
  async (req, res) => {
    try {
      let query = `
        SELECT 
          e.nome as empresa_nome,
          COUNT(u.id) as total_usuarios,
          COUNT(CASE WHEN u.tipo_usuario = 'gestor' THEN 1 END) as gestores,
          COUNT(CASE WHEN u.tipo_usuario = 'diretor' THEN 1 END) as diretores,
          COUNT(CASE WHEN u.tipo_usuario = 'professor' THEN 1 END) as professores,
          COUNT(CASE WHEN u.tipo_usuario = 'aluno' THEN 1 END) as alunos
        FROM empresas e 
        LEFT JOIN usuarios u ON e.id = u.empresa_id 
        GROUP BY e.id, e.nome
      `;
      let params = [];
      
      // Se não for admin, filtrar apenas a empresa do usuário
      if (req.filtroEmpresa !== null) {
        query += ' HAVING e.id = $1';
        params = [req.filtroEmpresa];
      }
      
      res.json({
        message: 'Relatório de usuários por empresa',
        filtro_aplicado: req.filtroEmpresa !== null,
        scope: req.user.tipo_usuario === 'admin' ? 'Todas as empresas' : `Empresa ${req.filtroEmpresa}`,
        user_info: {
          nome: req.user.nome,
          tipo: req.user.tipo_usuario
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao gerar relatório', error: error.message });
    }
  }
);

// EXEMPLO 13: Função de teste para verificar diferentes cenários
export async function testarVerificacaoEmpresa() {
  console.log('🧪 Testando verificação de empresa...\n');
  
  const cenarios = [
    {
      nome: 'Admin sem empresa_id',
      user: { id: 1, nome: 'Admin', tipo_usuario: 'admin', empresa_id: null },
      esperado: 'success'
    },
    {
      nome: 'Gestor com empresa_id',
      user: { id: 2, nome: 'Gestor', tipo_usuario: 'gestor', empresa_id: 1 },
      esperado: 'success'
    },
    {
      nome: 'Diretor sem empresa_id',
      user: { id: 3, nome: 'Diretor', tipo_usuario: 'diretor', empresa_id: null },
      esperado: 'error'
    },
    {
      nome: 'Professor com empresa_id',
      user: { id: 4, nome: 'Professor', tipo_usuario: 'professor', empresa_id: 2 },
      esperado: 'success'
    }
  ];
  
  for (const cenario of cenarios) {
    console.log(`🔍 Testando: ${cenario.nome}`);
    
    const req = { user: cenario.user };
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`   Status: ${code}`);
          console.log(`   Esperado: ${cenario.esperado}`);
          console.log(`   Resultado: ${code === 403 ? 'error' : 'success'}`);
          console.log(`   Mensagem: ${data.message}\n`);
        }
      })
    };
    const next = () => {
      console.log('   ✅ Acesso autorizado\n');
    };
    
    const middleware = verificarAcessoEmpresa;
    await middleware(req, res, next);
  }
}

// EXEMPLO 14: Função para testar filtros de empresa
export function testarFiltrosEmpresa() {
  console.log('🧪 Testando filtros de empresa...\n');
  
  const queries = [
    { query: 'SELECT * FROM contratos', params: [] },
    { query: 'SELECT * FROM escolas WHERE status = $1', params: ['ativa'] },
    { query: 'SELECT * FROM usuarios WHERE tipo_usuario = $1 AND status = $2', params: ['professor', 'ativo'] }
  ];
  
  const filtros = [null, 1, 2]; // null = admin, 1 e 2 = empresas específicas
  
  queries.forEach((item, index) => {
    console.log(`🔍 Query ${index + 1}: ${item.query}`);
    
    filtros.forEach(filtro => {
      const resultado = aplicarFiltroEmpresa(item.query, item.params, filtro);
      console.log(`   Filtro ${filtro}: ${resultado.query}`);
      console.log(`   Params: [${resultado.params.join(', ')}]\n`);
    });
  });
}

// EXEMPLO 15: Executar todos os testes
export async function executarTodosOsTestesAutorizacao() {
  console.log('🧪 Executando todos os testes de autorização...\n');
  
  try {
    await testarVerificacaoEmpresa();
    testarFiltrosEmpresa();
    console.log('✅ Todos os testes de autorização executados!');
  } catch (error) {
    console.error('❌ Erro nos testes de autorização:', error.message);
  }
}

export default app;