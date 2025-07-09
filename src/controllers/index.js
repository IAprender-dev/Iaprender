// Controllers - handle business logic and coordinate between routes and models

const logger = require('../utils/logger');

// Base controller class with common functionality
class BaseController {
  // Standard response format
  static sendResponse(res, statusCode, data, message = null) {
    const response = {
      success: statusCode < 400,
      ...(message && { message }),
      ...(data && { data })
    };
    
    res.status(statusCode).json(response);
  }
  
  // Handle controller errors
  static handleError(res, error, context = '') {
    logger.error(`Controller error ${context}:`, error);
    
    if (error.code === '23505') { // PostgreSQL unique violation
      return this.sendResponse(res, 409, null, 'Registro já existe');
    }
    
    if (error.code === '23503') { // PostgreSQL foreign key violation
      return this.sendResponse(res, 400, null, 'Referência inválida');
    }
    
    // Generic error response
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Erro interno do servidor';
      
    this.sendResponse(res, 500, null, message);
  }
  
  // Validate required fields
  static validateRequiredFields(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missing.join(', ')}`);
    }
  }
}

// User controller placeholder
class UserController extends BaseController {
  static async getProfile(req, res) {
    try {
      // Implementation pending - will use new hierarchical structure
      this.sendResponse(res, 200, { message: 'Perfil do usuário - implementação pendente' });
    } catch (error) {
      this.handleError(res, error, 'getProfile');
    }
  }
  
  static async updateProfile(req, res) {
    try {
      // Implementation pending - will use new hierarchical structure
      this.sendResponse(res, 200, { message: 'Atualização de perfil - implementação pendente' });
    } catch (error) {
      this.handleError(res, error, 'updateProfile');
    }
  }
}

// School controller placeholder
class SchoolController extends BaseController {
  static async getSchools(req, res) {
    try {
      // Implementation pending - will use new hierarchical structure
      this.sendResponse(res, 200, { message: 'Lista de escolas - implementação pendente' });
    } catch (error) {
      this.handleError(res, error, 'getSchools');
    }
  }
  
  static async createSchool(req, res) {
    try {
      // Implementation pending - will use new hierarchical structure
      this.sendResponse(res, 201, { message: 'Criação de escola - implementação pendente' });
    } catch (error) {
      this.handleError(res, error, 'createSchool');
    }
  }
}

// Auth controller placeholder
class AuthController extends BaseController {
  static async login(req, res) {
    try {
      // Implementation pending - will integrate with AWS Cognito
      this.sendResponse(res, 200, { message: 'Login - implementação pendente' });
    } catch (error) {
      this.handleError(res, error, 'login');
    }
  }
  
  static async logout(req, res) {
    try {
      // Implementation pending - will integrate with AWS Cognito
      this.sendResponse(res, 200, { message: 'Logout - implementação pendente' });
    } catch (error) {
      this.handleError(res, error, 'logout');
    }
  }
}

module.exports = {
  BaseController,
  UserController,
  SchoolController,
  AuthController
};