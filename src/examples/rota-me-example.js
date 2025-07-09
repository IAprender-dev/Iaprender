/**
 * EXEMPLO DE USO DA ROTA PROTEGIDA GET /me
 * 
 * Demonstra como usar a rota GET /api/usuarios/me configurada
 * com middleware autenticar e controller obterPerfil
 */

console.log('👤 EXEMPLO DE USO - ROTA PROTEGIDA GET /me');

// ============================================================================
// CONFIGURAÇÃO DA ROTA
// ============================================================================

const configuracaoRotas = {
  get_me: {
    endpoint: 'GET /api/usuarios/me',
    middleware: ['autenticar'],
    controller: 'UsuarioController.obterPerfil',
    rate_limit: '30 requests/min',
    permissoes: 'Qualquer usuário autenticado (próprios dados)',
    
    retorna: [
      'Dados do token JWT',
      'Dados completos do banco',
      'Dados específicos do tipo (professor, aluno, diretor, gestor)',
      'Informações da empresa vinculada'
    ]
  },
  
  put_me: {
    endpoint: 'PUT /api/usuarios/me',
    middleware: ['autenticar'],
    controller: 'UsuarioController.atualizarPerfil',
    rate_limit: '10 requests/min',
    permissoes: 'Qualquer usuário autenticado (próprios dados)',
    
    campos_permitidos_por_tipo: {
      admin: 'todos os campos incluindo email, tipo_usuario, empresa_id',
      gestor: 'dados pessoais + documento (não pode alterar email/tipo/empresa)',
      diretor: 'apenas dados pessoais básicos',
      professor: 'dados pessoais + disciplinas/formação específicas',
      aluno: 'dados limitados + informações do responsável'
    }
  }
};

// ============================================================================
// EXEMPLOS DE USO PRÁTICO
// ============================================================================

/**
 * EXEMPLO 1: Curl command
 */
const exemplocurl = `
# Obter perfil completo do usuário logado
curl -X GET "http://localhost:5000/api/usuarios/me" \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json"
`;

/**
 * EXEMPLO 1.5: Curl command para PUT /me (atualizar perfil)
 */
const exemploCurlPutMe = `
# Atualizar perfil próprio via PUT
curl -X PUT "http://localhost:5000/api/usuarios/me" \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "nome": "João Silva Santos",
    "telefone": "(11) 98765-4321",
    "endereco": "Av. Paulista, 1000",
    "cidade": "São Paulo"
  }'
`;

/**
 * EXEMPLO 2: JavaScript fetch
 */
const exemploJavaScript = `
// Obter perfil do usuário logado
async function obterMeuPerfil() {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch('/api/usuarios/me', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao obter perfil: ' + response.status);
    }
    
    const perfil = await response.json();
    console.log('Meu perfil:', perfil);
    
    return perfil;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

// Atualizar perfil próprio via PUT /me
async function atualizarMeuPerfil(dadosAtualizacao) {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch('/api/usuarios/me', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosAtualizacao)
    });
    
    if (!response.ok) {
      throw new Error('Erro ao atualizar perfil: ' + response.status);
    }
    
    const resultado = await response.json();
    console.log('Perfil atualizado:', resultado);
    
    return resultado;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

// Usar as funções
obterMeuPerfil()
  .then(perfil => {
    console.log('Nome:', perfil.data.nome);
    console.log('Tipo:', perfil.data.tipo_usuario);
    console.log('Empresa:', perfil.data.empresa?.nome);
  })
  .catch(error => {
    console.error('Falha ao carregar perfil:', error);
  });

// Exemplo de atualização
atualizarMeuPerfil({
  nome: 'João Silva Santos',
  telefone: '(11) 98765-4321',
  endereco: 'Av. Paulista, 1000'
})
  .then(resultado => {
    console.log('Perfil atualizado com sucesso:', resultado.data);
  })
  .catch(error => {
    console.error('Falha ao atualizar perfil:', error);
  });
`;

/**
 * EXEMPLO 3: Hook React customizado
 */
const exemploReactHook = `
import { useState, useEffect } from 'react';

// Hook para obter perfil do usuário logado
export function useMeuPerfil() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function carregarPerfil() {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }
        
        const response = await fetch('/api/usuarios/me', {
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token inválido ou expirado
            localStorage.removeItem('authToken');
            window.location.href = '/auth';
            return;
          }
          throw new Error(\`Erro HTTP: \${response.status}\`);
        }
        
        const data = await response.json();
        if (data.success) {
          setPerfil(data.data);
        } else {
          throw new Error(data.message || 'Erro ao carregar perfil');
        }
        
      } catch (err) {
        setError(err.message);
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    }
    
    carregarPerfil();
  }, []);
  
  const recarregarPerfil = () => {
    setLoading(true);
    carregarPerfil();
  };
  
  // Função para atualizar perfil via PUT /me
  const atualizarPerfil = async (dadosAtualizacao) => {
    try {
      setError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      const response = await fetch('/api/usuarios/me', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosAtualizacao)
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/auth';
          return;
        }
        throw new Error(\`Erro HTTP: \${response.status}\`);
      }
      
      const data = await response.json();
      if (data.success) {
        // Atualizar o estado local com os novos dados
        setPerfil(data.data.usuario || data.data);
        return data;
      } else {
        throw new Error(data.message || 'Erro ao atualizar perfil');
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Erro ao atualizar perfil:', err);
      throw err;
    }
  };
  
  return { perfil, loading, error, recarregarPerfil, atualizarPerfil };
}
`;

/**
 * EXEMPLO 4: Componente React usando o hook
 */
const exemploComponenteReact = `
import React from 'react';
import { useMeuPerfil } from './hooks/useMeuPerfil';

export function PerfilUsuario() {
  const { perfil, loading, error, recarregarPerfil, atualizarPerfil } = useMeuPerfil();
  const [editando, setEditando] = useState(false);
  const [dadosEdicao, setDadosEdicao] = useState({});
  const [salvando, setSalvando] = useState(false);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando perfil...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="ml-2 text-red-700">Erro ao carregar perfil: {error}</span>
        </div>
        <button 
          onClick={recarregarPerfil}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  
  if (!perfil) {
    return (
      <div className="text-center text-gray-500 p-8">
        Nenhum perfil encontrado
      </div>
    );
  }
  
  // Inicializar dados de edição quando começar a editar
  const iniciarEdicao = () => {
    setDadosEdicao({
      nome: perfil.nome || '',
      telefone: perfil.telefone || '',
      endereco: perfil.endereco || '',
      cidade: perfil.cidade || '',
      // Campos específicos por tipo
      ...(perfil.dadosEspecificos?.tipo === 'professor' && {
        disciplinas: perfil.dadosEspecificos.disciplinas || [],
        formacao: perfil.dadosEspecificos.formacao || ''
      })
    });
    setEditando(true);
  };
  
  // Salvar alterações via PUT /me
  const salvarAlteracoes = async () => {
    try {
      setSalvando(true);
      await atualizarPerfil(dadosEdicao);
      setEditando(false);
      setDadosEdicao({});
      // Mostrar notificação de sucesso aqui
    } catch (error) {
      // Mostrar notificação de erro aqui
      console.error('Erro ao salvar:', error);
    } finally {
      setSalvando(false);
    }
  };
  
  // Cancelar edição
  const cancelarEdicao = () => {
    setEditando(false);
    setDadosEdicao({});
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Header do perfil */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {perfil.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{perfil.nome}</h1>
            <p className="text-gray-600">{perfil.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {perfil.tipo_usuario}
            </span>
          </div>
        </div>
        
        {/* Botões de ação */}
        <div className="flex space-x-2">
          {!editando ? (
            <button 
              onClick={iniciarEdicao}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Editar Perfil (PUT /me)
            </button>
          ) : (
            <div className="flex space-x-2">
              <button 
                onClick={salvarAlteracoes}
                disabled={salvando}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button 
                onClick={cancelarEdicao}
                disabled={salvando}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Informações básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Informações Pessoais</h3>
          
          {!editando ? (
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                <dd className="text-sm text-gray-900">{perfil.telefone || 'Não informado'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Endereço</dt>
                <dd className="text-sm text-gray-900">
                  {perfil.endereco ? \`\${perfil.endereco}, \${perfil.cidade}/\${perfil.estado}\` : 'Não informado'}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={dadosEdicao.nome || ''}
                  onChange={(e) => setDadosEdicao({...dadosEdicao, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={dadosEdicao.telefone || ''}
                  onChange={(e) => setDadosEdicao({...dadosEdicao, telefone: e.target.value})}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={dadosEdicao.endereco || ''}
                  onChange={(e) => setDadosEdicao({...dadosEdicao, endereco: e.target.value})}
                  placeholder="Rua, número, bairro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={dadosEdicao.cidade || ''}
                  onChange={(e) => setDadosEdicao({...dadosEdicao, cidade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        
        {perfil.empresa && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Empresa</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nome</dt>
                <dd className="text-sm text-gray-900">{perfil.empresa.nome}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">CNPJ</dt>
                <dd className="text-sm text-gray-900">{perfil.empresa.cnpj}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Localização</dt>
                <dd className="text-sm text-gray-900">{perfil.empresa.cidade}/{perfil.empresa.estado}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
      
      {/* Dados específicos do tipo de usuário */}
      {perfil.dadosEspecificos && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Informações Específicas - {perfil.dadosEspecificos.tipo}
          </h3>
          
          {perfil.dadosEspecificos.tipo === 'professor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Disciplinas</dt>
                <dd className="text-sm text-gray-900">
                  {perfil.dadosEspecificos.disciplinas?.join(', ') || 'Não informado'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Formação</dt>
                <dd className="text-sm text-gray-900">{perfil.dadosEspecificos.formacao || 'Não informado'}</dd>
              </div>
            </div>
          )}
          
          {perfil.dadosEspecificos.tipo === 'aluno' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Matrícula</dt>
                <dd className="text-sm text-gray-900">{perfil.dadosEspecificos.matricula}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Turma/Série</dt>
                <dd className="text-sm text-gray-900">
                  {perfil.dadosEspecificos.turma} - {perfil.dadosEspecificos.serie}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Responsável</dt>
                <dd className="text-sm text-gray-900">{perfil.dadosEspecificos.nome_responsavel}</dd>
              </div>
            </div>
          )}
          
          {perfil.dadosEspecificos.tipo === 'diretor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Cargo</dt>
                <dd className="text-sm text-gray-900">{perfil.dadosEspecificos.cargo}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Data de Início</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(perfil.dadosEspecificos.data_inicio).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            </div>
          )}
          
          {perfil.dadosEspecificos.tipo === 'gestor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Cargo</dt>
                <dd className="text-sm text-gray-900">{perfil.dadosEspecificos.cargo}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Data de Admissão</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(perfil.dadosEspecificos.data_admissao).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Metadata */}
      {perfil.metadata && (
        <div className="border-t pt-4 mt-6">
          <p className="text-xs text-gray-500">
            Último acesso: {new Date(perfil.metadata.ultimo_acesso).toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
}
`;

// ============================================================================
// RESPOSTAS ESPERADAS POR TIPO DE USUÁRIO
// ============================================================================

const respostasEsperadas = {
  professor: {
    success: true,
    message: 'Perfil completo obtido com sucesso',
    data: {
      // Dados do token JWT
      id: 123,
      sub: 'us-east-1_abc123',
      nome: 'João Silva',
      email: 'joao@escola.edu.br',
      tipo_usuario: 'professor',
      empresa_id: 5,
      groups: ['Professores'],
      
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
      },
      
      metadata: {
        ultimo_acesso: '2025-01-09T19:00:00.000Z',
        versao_perfil: '1.0',
        fonte_dados: 'jwt_token_e_banco_local',
        dados_especificos_carregados: true
      }
    }
  },
  
  aluno: {
    success: true,
    message: 'Perfil completo obtido com sucesso',
    data: {
      id: 456,
      nome: 'Maria Santos',
      email: 'maria@escola.edu.br',
      tipo_usuario: 'aluno',
      empresa_id: 5,
      
      dadosEspecificos: {
        tipo: 'aluno',
        aluno_id: 89,
        escola_id: 15,
        matricula: '2024001',
        turma: '9º A',
        serie: '9º Ano',
        turno: 'Manhã',
        nome_responsavel: 'Ana Santos',
        contato_responsavel: '(11) 99999-8888',
        data_matricula: '2024-02-01',
        status: 'ativo'
      }
    }
  },
  
  admin: {
    success: true,
    message: 'Perfil completo obtido com sucesso',
    data: {
      id: 1,
      nome: 'Administrador Sistema',
      email: 'admin@iaprender.com',
      tipo_usuario: 'admin',
      empresa_id: null,
      
      dadosEspecificos: {
        tipo: 'admin',
        descricao: 'Administrador do sistema',
        permissoes: [
          'Gestão completa de usuários',
          'Gestão de empresas e contratos',
          'Acesso a estatísticas globais',
          'Configurações do sistema'
        ],
        acesso_total: true
      }
    }
  }
};

// ============================================================================
// CASOS DE ERRO E VALIDAÇÃO
// ============================================================================

const casosDeErro = {
  'Token não fornecido': {
    status: 401,
    response: {
      success: false,
      message: 'Token de autenticação não fornecido',
      timestamp: '2025-01-09T19:00:00.000Z'
    }
  },
  
  'Token inválido': {
    status: 401,
    response: {
      success: false,
      message: 'Token de autenticação inválido',
      timestamp: '2025-01-09T19:00:00.000Z'
    }
  },
  
  'Token expirado': {
    status: 401,
    response: {
      success: false,
      message: 'Token de autenticação expirado',
      timestamp: '2025-01-09T19:00:00.000Z'
    }
  },
  
  'Rate limit excedido': {
    status: 429,
    response: {
      success: false,
      message: 'Muitas requisições de perfil completo. Aguarde antes de tentar novamente.',
      timestamp: '2025-01-09T19:00:00.000Z'
    }
  },
  
  'Usuário não encontrado': {
    status: 404,
    response: {
      success: false,
      message: 'Dados do usuário não encontrados no banco',
      timestamp: '2025-01-09T19:00:00.000Z'
    }
  }
};

// ============================================================================
// EXPORTAÇÃO DOS EXEMPLOS
// ============================================================================

export {
  configuracaoRota,
  exemplocurl,
  exemploJavaScript,
  exemploReactHook,
  exemploComponenteReact,
  respostasEsperadas,
  casosDeErro
};

/**
 * RESUMO DA CONFIGURAÇÃO:
 * 
 * ✅ Rota: GET /api/usuarios/me
 * ✅ Middleware: autenticar
 * ✅ Controller: UsuarioController.obterPerfil
 * ✅ Rate Limit: 30 requests/min
 * ✅ Permissões: Usuário autenticado (próprios dados)
 * ✅ Retorna: Perfil completo com dados específicos do tipo
 * ✅ Exemplos: curl, JavaScript, React Hook, Componente
 * ✅ Tratamento de erros: 401, 404, 429, 500
 * 
 * STATUS: ROTA CONFIGURADA E DOCUMENTADA COMPLETAMENTE
 */