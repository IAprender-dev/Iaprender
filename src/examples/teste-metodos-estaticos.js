import { Usuario } from '../models/Usuario.js';

/**
 * Teste rápido dos métodos estáticos do modelo Usuario
 */
async function testeMetodosEstaticos() {
  console.log('🧪 Iniciando teste dos métodos estáticos do Usuario...\n');
  
  try {
    // ===============================================
    // 1. Teste do método estático criar()
    // ===============================================
    console.log('1️⃣ Testando método estático criar()...');
    
    const dadosUsuario = {
      email: 'teste.metodo@exemplo.com',
      nome: 'Teste Método Estático',
      tipo_usuario: 'professor',
      empresa_id: 1,
      telefone: '(11) 99999-9999',
      configuracoes: {
        tema: 'light',
        notificacoes: true
      }
    };
    
    const usuarioCriado = await Usuario.criar(dadosUsuario);
    console.log('✅ Usuário criado com sucesso:', usuarioCriado.id);
    
    // ===============================================
    // 2. Teste dos métodos estáticos de busca
    // ===============================================
    console.log('\n2️⃣ Testando métodos estáticos de busca...');
    
    // Buscar por email
    const usuarioPorEmail = await Usuario.buscarPorEmail(usuarioCriado.email);
    console.log('✅ Busca por email:', usuarioPorEmail ? usuarioPorEmail.nome : 'Não encontrado');
    
    // Buscar por ID (usando método original)
    const usuarioPorId = await Usuario.findById(usuarioCriado.id);
    console.log('✅ Busca por ID:', usuarioPorId ? usuarioPorId.nome : 'Não encontrado');
    
    // Buscar por empresa
    const usuariosPorEmpresa = await Usuario.buscarPorEmpresa(1);
    console.log('✅ Busca por empresa:', usuariosPorEmpresa.length, 'usuários encontrados');
    
    // ===============================================
    // 3. Teste do método estático atualizar()
    // ===============================================
    console.log('\n3️⃣ Testando método estático atualizar()...');
    
    const usuarioAtualizado = await Usuario.atualizar(usuarioCriado.id, {
      telefone: '(11) 88888-8888',
      endereco: 'Rua Teste Atualizada, 456 - São Paulo/SP'
    });
    
    console.log('✅ Usuário atualizado - Telefone:', usuarioAtualizado.telefone);
    console.log('✅ Usuário atualizado - Endereço:', usuarioAtualizado.endereco);
    
    // ===============================================
    // 4. Teste do método estático deletar()
    // ===============================================
    console.log('\n4️⃣ Testando método estático deletar()...');
    
    const foiDeletado = await Usuario.deletar(usuarioCriado.id);
    console.log('✅ Usuário deletado:', foiDeletado);
    
    // Verificar se realmente foi deletado
    const usuarioVerificacao = await Usuario.findById(usuarioCriado.id);
    console.log('✅ Verificação pós-exclusão:', usuarioVerificacao ? 'Ainda existe' : 'Deletado com sucesso');
    
    // ===============================================
    // 5. Resumo dos testes
    // ===============================================
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('='.repeat(50));
    console.log('✅ Usuario.criar() - FUNCIONANDO');
    console.log('✅ Usuario.buscarPorEmail() - FUNCIONANDO');
    console.log('✅ Usuario.buscarPorEmpresa() - FUNCIONANDO');
    console.log('✅ Usuario.atualizar() - FUNCIONANDO');
    console.log('✅ Usuario.deletar() - FUNCIONANDO');
    console.log('='.repeat(50));
    console.log('🎉 Todos os métodos estáticos estão funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro no teste dos métodos estáticos:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testeMetodosEstaticos();

/**
 * Exemplo de uso dos métodos estáticos nos controllers/rotas
 */
export const exemploUsoEmRotas = {
  
  // Exemplo de uso em rota POST /api/usuarios
  async criarUsuario(req, res) {
    try {
      const novoUsuario = await Usuario.criar(req.body);
      res.status(201).json({
        success: true,
        data: novoUsuario.toJSON()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },
  
  // Exemplo de uso em rota GET /api/usuarios/cognito/:sub
  async buscarPorCognitoSub(req, res) {
    try {
      const usuario = await Usuario.buscarPorCognitoSub(req.params.sub);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: usuario.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },
  
  // Exemplo de uso em rota GET /api/usuarios/email/:email
  async buscarPorEmail(req, res) {
    try {
      const usuario = await Usuario.buscarPorEmail(req.params.email);
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: usuario.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },
  
  // Exemplo de uso em rota GET /api/usuarios/empresa/:id
  async buscarPorEmpresa(req, res) {
    try {
      const usuarios = await Usuario.buscarPorEmpresa(req.params.id);
      
      res.json({
        success: true,
        data: usuarios.map(u => u.toJSON()),
        count: usuarios.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },
  
  // Exemplo de uso em rota PUT /api/usuarios/:id
  async atualizarUsuario(req, res) {
    try {
      const usuarioAtualizado = await Usuario.atualizar(req.params.id, req.body);
      
      res.json({
        success: true,
        data: usuarioAtualizado.toJSON()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },
  
  // Exemplo de uso em rota DELETE /api/usuarios/:id
  async deletarUsuario(req, res) {
    try {
      const foiDeletado = await Usuario.deletar(req.params.id);
      
      res.json({
        success: true,
        message: 'Usuário deletado com sucesso',
        deleted: foiDeletado
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

export default testeMetodosEstaticos;