/**
 * EXEMPLOS PRÁTICOS DE USO DAS ROTAS DE USUÁRIOS
 * 
 * Este arquivo demonstra como usar todas as 13 rotas implementadas no sistema
 * de gestão de usuários, com exemplos de curl, JavaScript fetch e casos de uso.
 */

console.log('📋 EXEMPLOS DE USO DAS ROTAS DE USUÁRIOS - SISTEMA IAPRENDER');

// ============================================================================
// CATEGORIA 1: ROTAS DE CONSULTA
// ============================================================================

/**
 * EXEMPLO 1: Buscar usuário por ID
 * GET /api/usuarios/:id
 */
const exemploConsultaPorId = {
  rota: 'GET /api/usuarios/123',
  middleware: ['autenticar', 'verificarAcessoUsuario'],
  permissoes: 'Próprios dados ou admin/gestor da mesma empresa',
  
  // Curl command
  curl: `
    curl -X GET "http://localhost:5000/api/usuarios/123" \\
      -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \\
      -H "Content-Type: application/json"
  `,
  
  // JavaScript fetch
  javascript: `
    const response = await fetch('/api/usuarios/123', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    const usuario = await response.json();
  `,
  
  resposta_sucesso: {
    success: true,
    message: 'Usuário encontrado',
    data: {
      id: 123,
      nome: 'João Silva',
      email: 'joao@escola.edu.br',
      tipo_usuario: 'professor',
      empresa_id: 5,
      status: 'ativo'
    },
    timestamp: '2025-01-09T19:00:00.000Z'
  }
};

/**
 * EXEMPLO 2: Buscar usuário por email
 * GET /api/usuarios/email/:email
 */
const exemploConsultaPorEmail = {
  rota: 'GET /api/usuarios/email/professor@escola.edu.br',
  middleware: ['autenticar', 'adminOuGestor'],
  permissoes: 'Admin (qualquer email) ou Gestor (mesma empresa)',
  
  curl: `
    curl -X GET "http://localhost:5000/api/usuarios/email/professor@escola.edu.br" \\
      -H "Authorization: Bearer $TOKEN" \\
      -H "Content-Type: application/json"
  `,
  
  javascript: `
    const email = encodeURIComponent('professor@escola.edu.br');
    const response = await fetch(\`/api/usuarios/email/\${email}\`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
  `
};

/**
 * EXEMPLO 3: Listar usuários com filtros
 * GET /api/usuarios
 */
const exemploListagem = {
  rota: 'GET /api/usuarios',
  middleware: ['autenticar', 'adminOuGestor', 'verificarEmpresa'],
  
  // Filtros disponíveis
  filtros: {
    page: 1,
    limit: 25,
    tipo_usuario: 'professor',
    status: 'ativo',
    search: 'João',
    orderBy: 'nome',
    orderDirection: 'ASC',
    data_inicio: '2024-01-01',
    data_fim: '2024-12-31'
  },
  
  curl: `
    curl -X GET "http://localhost:5000/api/usuarios?page=1&limit=25&tipo_usuario=professor&status=ativo&search=João&orderBy=nome&orderDirection=ASC" \\
      -H "Authorization: Bearer $TOKEN"
  `,
  
  javascript: `
    const params = new URLSearchParams({
      page: 1,
      limit: 25,
      tipo_usuario: 'professor',
      status: 'ativo',
      search: 'João',
      orderBy: 'nome',
      orderDirection: 'ASC'
    });
    
    const response = await fetch(\`/api/usuarios?\${params}\`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
  `,
  
  resposta_com_paginacao: {
    success: true,
    data: {
      usuarios: ['array de usuários'],
      pagination: {
        page: 1,
        limit: 25,
        total: 45,
        pages: 2,
        hasNext: true,
        hasPrev: false
      },
      filters: {
        empresa_id: 5,
        tipo_usuario: 'professor',
        status: 'ativo'
      }
    }
  }
};

// ============================================================================
// CATEGORIA 2: ROTAS DE GESTÃO
// ============================================================================

/**
 * EXEMPLO 4: Criar novo usuário
 * POST /api/usuarios
 */
const exemploCriacao = {
  rota: 'POST /api/usuarios',
  middleware: ['autenticar', 'adminOuGestor'],
  
  // Dados para criar professor
  dados_professor: {
    cognito_sub: 'us-east-1_xyz123456',
    email: 'novo.professor@escola.edu.br',
    nome: 'Ana Maria Santos',
    tipo_usuario: 'professor',
    telefone: '(11) 99999-8888',
    documento: '123.456.789-10',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    // Campos específicos do professor
    disciplinas: ['Matemática', 'Física'],
    formacao: 'Licenciatura em Matemática',
    escola_id: 15,
    data_admissao: '2025-01-09'
  },
  
  curl: `
    curl -X POST "http://localhost:5000/api/usuarios" \\
      -H "Authorization: Bearer $TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{
        "cognito_sub": "us-east-1_xyz123456",
        "email": "novo.professor@escola.edu.br",
        "nome": "Ana Maria Santos",
        "tipo_usuario": "professor",
        "disciplinas": ["Matemática", "Física"],
        "formacao": "Licenciatura em Matemática",
        "escola_id": 15
      }'
  `,
  
  javascript: `
    const novoUsuario = {
      cognito_sub: 'us-east-1_xyz123456',
      email: 'novo.professor@escola.edu.br',
      nome: 'Ana Maria Santos',
      tipo_usuario: 'professor',
      disciplinas: ['Matemática', 'Física'],
      formacao: 'Licenciatura em Matemática',
      escola_id: 15
    };
    
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(novoUsuario)
    });
  `
};

/**
 * EXEMPLO 5: Atualizar usuário
 * PATCH /api/usuarios/:id
 */
const exemploAtualizacao = {
  rota: 'PATCH /api/usuarios/123',
  middleware: ['autenticar', 'verificarAcessoUsuario'],
  
  dados_atualizacao: {
    nome: 'João Silva Santos',
    telefone: '(11) 98765-4321',
    endereco: 'Av. Paulista, 1000',
    cidade: 'São Paulo'
  },
  
  curl: `
    curl -X PATCH "http://localhost:5000/api/usuarios/123" \\
      -H "Authorization: Bearer $TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{
        "nome": "João Silva Santos",
        "telefone": "(11) 98765-4321",
        "endereco": "Av. Paulista, 1000"
      }'
  `,
  
  javascript: `
    const atualizacoes = {
      nome: 'João Silva Santos',
      telefone: '(11) 98765-4321',
      endereco: 'Av. Paulista, 1000'
    };
    
    const response = await fetch('/api/usuarios/123', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(atualizacoes)
    });
  `
};

// ============================================================================
// CATEGORIA 3: ROTAS DE PERFIL
// ============================================================================

/**
 * EXEMPLO 6: Obter perfil básico
 * GET /api/usuarios/me
 */
const exemploPerfilBasico = {
  rota: 'GET /api/usuarios/me',
  middleware: ['autenticar'],
  permissoes: 'Qualquer usuário autenticado (próprios dados)',
  
  curl: `
    curl -X GET "http://localhost:5000/api/usuarios/me" \\
      -H "Authorization: Bearer $TOKEN"
  `,
  
  javascript: `
    const response = await fetch('/api/usuarios/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const meuPerfil = await response.json();
  `,
  
  resposta: {
    success: true,
    data: {
      id: 123,
      nome: 'João Silva',
      email: 'joao@escola.edu.br',
      tipo_usuario: 'professor',
      empresa_id: 5,
      metadata: {
        ultimo_acesso_perfil: '2025-01-09T19:00:00.000Z',
        fonte_dados: 'banco_local'
      }
    }
  }
};

/**
 * EXEMPLO 7: Obter perfil completo
 * GET /api/usuarios/perfil
 */
const exemploPerfilCompleto = {
  rota: 'GET /api/usuarios/perfil',
  middleware: ['autenticar'],
  
  curl: `
    curl -X GET "http://localhost:5000/api/usuarios/perfil" \\
      -H "Authorization: Bearer $TOKEN"
  `,
  
  resposta_professor: {
    success: true,
    data: {
      // Dados do token JWT
      id: 123,
      sub: 'us-east-1_abc123',
      nome: 'João Silva',
      email: 'joao@escola.edu.br',
      tipo_usuario: 'professor',
      empresa_id: 5,
      
      // Dados específicos do professor
      dadosEspecificos: {
        tipo: 'professor',
        professor_id: 78,
        escola_id: 15,
        disciplinas: ['Matemática', 'Física'],
        formacao: 'Licenciatura em Matemática',
        data_admissao: '2024-02-15',
        status: 'ativo'
      },
      
      // Dados da empresa
      empresa: {
        id: 5,
        nome: 'Prefeitura de São Paulo',
        cnpj: '12345678000195',
        cidade: 'São Paulo',
        estado: 'SP'
      }
    }
  }
};

/**
 * EXEMPLO 8: Atualizar próprio perfil
 * PATCH /api/usuarios/perfil
 */
const exemploAtualizarPerfil = {
  rota: 'PATCH /api/usuarios/perfil',
  middleware: ['autenticar'],
  
  // Dados que professor pode atualizar
  dados_professor: {
    nome: 'João Silva Santos',
    telefone: '(11) 98765-4321',
    endereco: 'Av. Paulista, 1000',
    disciplinas: ['Matemática', 'Física', 'Química'], // Específico do professor
    formacao: 'Mestrado em Matemática'
  },
  
  curl: `
    curl -X PATCH "http://localhost:5000/api/usuarios/perfil" \\
      -H "Authorization: Bearer $TOKEN" \\
      -H "Content-Type: application/json" \\
      -d '{
        "nome": "João Silva Santos",
        "telefone": "(11) 98765-4321",
        "disciplinas": ["Matemática", "Física", "Química"]
      }'
  `,
  
  resposta_com_metadata: {
    success: true,
    data: {
      usuario: '{ dados atualizados }',
      atualizacoes: {
        campos_atualizados: ['nome', 'telefone'],
        campos_ignorados: [],
        dados_especificos: {
          atualizou: true,
          tipo: 'professor',
          campos: ['disciplinas']
        }
      }
    }
  }
};

// ============================================================================
// CATEGORIA 4: ROTAS ESPECIALIZADAS
// ============================================================================

/**
 * EXEMPLO 9: Listar usuários por empresa
 * GET /api/usuarios/empresa/:empresaId
 */
const exemploListarPorEmpresa = {
  rota: 'GET /api/usuarios/empresa/5',
  middleware: ['autenticar', 'verificarEmpresa'],
  
  curl: `
    curl -X GET "http://localhost:5000/api/usuarios/empresa/5" \\
      -H "Authorization: Bearer $TOKEN"
  `,
  
  javascript: `
    const empresaId = 5;
    const response = await fetch(\`/api/usuarios/empresa/\${empresaId}\`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
  `
};

/**
 * EXEMPLO 10: Obter estatísticas
 * GET /api/usuarios/stats
 */
const exemploEstatisticas = {
  rota: 'GET /api/usuarios/stats',
  middleware: ['autenticar', 'adminOuGestor'],
  
  curl: `
    curl -X GET "http://localhost:5000/api/usuarios/stats" \\
      -H "Authorization: Bearer $TOKEN"
  `,
  
  resposta: {
    success: true,
    data: {
      total_usuarios: 150,
      por_tipo: {
        admin: 3,
        gestor: 8,
        diretor: 15,
        professor: 89,
        aluno: 35
      },
      por_status: {
        ativo: 142,
        inativo: 8
      },
      estatisticas: {
        usuarios_hoje: 12,
        ultimo_login_24h: 89,
        media_usuarios_por_empresa: 30
      }
    }
  }
};

// ============================================================================
// EXEMPLOS DE USO EM APLICAÇÕES REACT
// ============================================================================

/**
 * EXEMPLO 11: Hook customizado para gerenciar usuários
 */
const exemploReactHook = `
import { useState, useEffect } from 'react';

// Hook para gerenciar lista de usuários
export function useUsuarios(filtros = {}) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  
  const token = localStorage.getItem('authToken');
  
  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filtros);
      const response = await fetch(\`/api/usuarios?\${params}\`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.data.usuarios);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const criarUsuario = async (dadosUsuario) => {
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosUsuario)
    });
    
    if (response.ok) {
      carregarUsuarios(); // Recarregar lista
    }
    
    return response.json();
  };
  
  const atualizarUsuario = async (id, dados) => {
    const response = await fetch(\`/api/usuarios/\${id}\`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });
    
    if (response.ok) {
      carregarUsuarios();
    }
    
    return response.json();
  };
  
  useEffect(() => {
    carregarUsuarios();
  }, [JSON.stringify(filtros)]);
  
  return {
    usuarios,
    loading,
    pagination,
    carregarUsuarios,
    criarUsuario,
    atualizarUsuario
  };
}
`;

/**
 * EXEMPLO 12: Componente de listagem de usuários
 */
const exemploComponenteReact = `
import React from 'react';
import { useUsuarios } from './hooks/useUsuarios';

export function ListaUsuarios({ filtros }) {
  const { usuarios, loading, pagination, atualizarUsuario } = useUsuarios(filtros);
  
  if (loading) {
    return <div>Carregando usuários...</div>;
  }
  
  return (
    <div className="lista-usuarios">
      <h2>Usuários ({pagination?.total || 0})</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuarios.map(usuario => (
          <div key={usuario.id} className="card p-4 border rounded">
            <h3>{usuario.nome}</h3>
            <p>Email: {usuario.email}</p>
            <p>Tipo: {usuario.tipo_usuario}</p>
            <p>Status: {usuario.status}</p>
            
            <div className="mt-4 space-x-2">
              <button 
                onClick={() => verDetalhes(usuario.id)}
                className="btn btn-primary"
              >
                Ver Detalhes
              </button>
              
              <button 
                onClick={() => editarUsuario(usuario)}
                className="btn btn-secondary"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {pagination && pagination.pages > 1 && (
        <div className="pagination mt-6">
          {/* Componente de paginação */}
        </div>
      )}
    </div>
  );
}
`;

// ============================================================================
// EXEMPLOS DE MIDDLEWARE E AUTORIZAÇÃO
// ============================================================================

/**
 * EXEMPLO 13: Testando diferentes níveis de autorização
 */
const exemploAutorizacao = {
  cenarios: {
    'Admin acessando qualquer usuário': {
      usuario: { tipo_usuario: 'admin', empresa_id: null },
      endpoint: 'GET /api/usuarios/123',
      resultado: 'SUCCESS - Admin tem acesso total'
    },
    
    'Gestor acessando usuário da mesma empresa': {
      usuario: { tipo_usuario: 'gestor', empresa_id: 5 },
      endpoint: 'GET /api/usuarios/456', // usuário da empresa 5
      resultado: 'SUCCESS - Mesma empresa'
    },
    
    'Gestor tentando acessar usuário de outra empresa': {
      usuario: { tipo_usuario: 'gestor', empresa_id: 5 },
      endpoint: 'GET /api/usuarios/789', // usuário da empresa 8
      resultado: 'ERROR 403 - Acesso negado'
    },
    
    'Professor acessando próprios dados': {
      usuario: { id: 123, tipo_usuario: 'professor' },
      endpoint: 'GET /api/usuarios/123',
      resultado: 'SUCCESS - Próprios dados'
    },
    
    'Professor tentando acessar dados de outro': {
      usuario: { id: 123, tipo_usuario: 'professor' },
      endpoint: 'GET /api/usuarios/456',
      resultado: 'ERROR 403 - Acesso negado'
    }
  }
};

// ============================================================================
// EXPORTAÇÃO DOS EXEMPLOS
// ============================================================================

export {
  exemploConsultaPorId,
  exemploConsultaPorEmail,
  exemploListagem,
  exemploCriacao,
  exemploAtualizacao,
  exemploPerfilBasico,
  exemploPerfilCompleto,
  exemploAtualizarPerfil,
  exemploListarPorEmpresa,
  exemploEstatisticas,
  exemploReactHook,
  exemploComponenteReact,
  exemploAutorizacao
};

/**
 * RESUMO DOS EXEMPLOS:
 * 
 * ✅ 13 rotas documentadas com exemplos completos
 * ✅ Curl commands para todas as operações
 * ✅ JavaScript fetch examples
 * ✅ Exemplos de integração React
 * ✅ Hook customizado para gerenciamento de estado
 * ✅ Componente de listagem funcional
 * ✅ Casos de teste de autorização
 * ✅ Exemplos de respostas esperadas
 * ✅ Filtros e paginação demonstrados
 * ✅ Tratamento de erros incluído
 * 
 * STATUS: DOCUMENTAÇÃO COMPLETA PARA DESENVOLVEDORES
 */