const fs = require('fs');
require('dotenv').config();

class AuroraDSQLTokenManager {
  constructor() {
    this.tokenFile = '.env';
    this.checkInterval = 5 * 60 * 1000; // 5 minutos
    this.renewThreshold = 10 * 60; // 10 minutos antes de expirar
  }

  // Verificar se token está próximo do vencimento
  isTokenExpiring() {
    const token = process.env.TOKEN_AURORA;
    
    if (!token || !token.includes('X-Amz-Date=')) {
      return false;
    }

    try {
      const dateMatch = token.match(/X-Amz-Date=(\d{8}T\d{6}Z)/);
      const expiresMatch = token.match(/X-Amz-Expires=(\d+)/);
      
      if (!dateMatch || !expiresMatch) return false;

      const tokenDate = dateMatch[1];
      const expiresIn = parseInt(expiresMatch[1]);
      
      const year = tokenDate.substring(0, 4);
      const month = tokenDate.substring(4, 6);
      const day = tokenDate.substring(6, 8);
      const hour = tokenDate.substring(9, 11);
      const minute = tokenDate.substring(11, 13);
      
      const tokenTimestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
      const expirationTime = new Date(tokenTimestamp.getTime() + (expiresIn * 1000));
      const now = new Date();
      const timeUntilExpiry = expirationTime - now;
      
      console.log(`🕐 Token expira em: ${Math.floor(timeUntilExpiry / 1000 / 60)} minutos`);
      
      return timeUntilExpiry < (this.renewThreshold * 1000);
      
    } catch (error) {
      console.log(`❌ Erro ao verificar expiração: ${error.message}`);
      return false;
    }
  }

  // Aplicar novo token
  applyNewToken(newToken) {
    try {
      let envContent = fs.readFileSync(this.tokenFile, 'utf8');
      
      if (envContent.includes('TOKEN_AURORA=')) {
        envContent = envContent.replace(/TOKEN_AURORA=.*/, `TOKEN_AURORA=${newToken}`);
      } else {
        envContent += `\nTOKEN_AURORA=${newToken}\n`;
      }
      
      fs.writeFileSync(this.tokenFile, envContent);
      
      // Atualizar variável de ambiente em runtime
      process.env.TOKEN_AURORA = newToken;
      
      console.log('✅ Novo token aplicado com sucesso');
      console.log(`🔑 Token: ${newToken.substring(0, 50)}...`);
      
      return true;
    } catch (error) {
      console.log(`❌ Erro ao aplicar token: ${error.message}`);
      return false;
    }
  }

  // Monitorar status do token
  startMonitoring() {
    console.log('🔄 Iniciando monitoramento de token Aurora DSQL...');
    
    setInterval(() => {
      if (this.isTokenExpiring()) {
        console.log('⚠️ Token Aurora DSQL próximo do vencimento!');
        console.log('🔔 Notifique o administrador para gerar novo token');
        
        // Aqui poderia integrar com sistema de notificações
        // ou tentar renovar automaticamente se tiver permissões
      }
    }, this.checkInterval);
  }

  // Status atual do token
  getTokenStatus() {
    const token = process.env.TOKEN_AURORA;
    
    if (!token) {
      return { status: 'missing', message: 'Token não encontrado' };
    }

    if (!token.includes('X-Amz-Date=')) {
      return { status: 'static', message: 'Token estático (não expira)' };
    }

    try {
      const dateMatch = token.match(/X-Amz-Date=(\d{8}T\d{6}Z)/);
      const expiresMatch = token.match(/X-Amz-Expires=(\d+)/);
      
      if (!dateMatch || !expiresMatch) {
        return { status: 'invalid', message: 'Formato de token inválido' };
      }

      const tokenDate = dateMatch[1];
      const expiresIn = parseInt(expiresMatch[1]);
      
      const year = tokenDate.substring(0, 4);
      const month = tokenDate.substring(4, 6);
      const day = tokenDate.substring(6, 8);
      const hour = tokenDate.substring(9, 11);
      const minute = tokenDate.substring(11, 13);
      
      const tokenTimestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
      const expirationTime = new Date(tokenTimestamp.getTime() + (expiresIn * 1000));
      const now = new Date();
      const timeUntilExpiry = expirationTime - now;
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 1000 / 60);
      
      if (timeUntilExpiry < 0) {
        return { 
          status: 'expired', 
          message: `Token expirado há ${Math.abs(minutesUntilExpiry)} minutos`,
          expiredMinutes: Math.abs(minutesUntilExpiry)
        };
      } else if (timeUntilExpiry < (this.renewThreshold * 1000)) {
        return { 
          status: 'expiring', 
          message: `Token expira em ${minutesUntilExpiry} minutos`,
          minutesUntilExpiry
        };
      } else {
        return { 
          status: 'valid', 
          message: `Token válido por ${minutesUntilExpiry} minutos`,
          minutesUntilExpiry
        };
      }
      
    } catch (error) {
      return { status: 'error', message: `Erro: ${error.message}` };
    }
  }
}

// Função utilitária para usar externamente
function checkTokenStatus() {
  const manager = new AuroraDSQLTokenManager();
  const status = manager.getTokenStatus();
  
  console.log('🔍 STATUS DO TOKEN AURORA DSQL');
  console.log('=============================');
  console.log(`📊 Status: ${status.status.toUpperCase()}`);
  console.log(`💬 Mensagem: ${status.message}`);
  
  return status;
}

// Se executado diretamente
if (require.main === module) {
  checkTokenStatus();
}

module.exports = { AuroraDSQLTokenManager, checkTokenStatus };