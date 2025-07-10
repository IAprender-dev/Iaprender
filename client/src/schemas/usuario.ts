/**
 * SCHEMAS DE VALIDAÇÃO - USUÁRIOS
 * 
 * Schemas Zod para validação de formulários de usuários
 */

import { z } from 'zod';

// Função auxiliar para validar CPF
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return digit1 === parseInt(cleanCPF[9]) && digit2 === parseInt(cleanCPF[10]);
};

// Função auxiliar para validar telefone brasileiro
const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;
  
  const validDDDs = [
    '11', '12', '13', '14', '15', '16', '17', '18', '19',
    '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38',
    '41', '42', '43', '44', '45', '46', '47', '48', '49',
    '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69',
    '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89',
    '91', '92', '93', '94', '95', '96', '97', '98', '99'
  ];
  
  const ddd = cleanPhone.substring(0, 2);
  return validDDDs.includes(ddd);
};

// Schema base para usuário
export const usuarioBaseSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode ter mais de 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email deve ter um formato válido')
    .toLowerCase(),
  phone: z
    .string()
    .optional()
    .refine((phone) => !phone || validatePhone(phone), {
      message: 'Telefone deve ter um formato válido (DD) XXXXX-XXXX',
    }),
  document: z
    .string()
    .optional()
    .refine((doc) => !doc || validateCPF(doc), {
      message: 'CPF deve ter um formato válido',
    }),
  birth_date: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 120;
    }, {
      message: 'Data de nascimento deve ser válida',
    }),
  address: z
    .string()
    .max(200, 'Endereço não pode ter mais de 200 caracteres')
    .optional(),
  city: z
    .string()
    .max(100, 'Cidade não pode ter mais de 100 caracteres')
    .optional(),
  state: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres (UF)')
    .optional(),
  cep: z
    .string()
    .optional()
    .refine((cep) => {
      if (!cep) return true;
      const cleanCEP = cep.replace(/\D/g, '');
      return cleanCEP.length === 8;
    }, {
      message: 'CEP deve ter 8 dígitos',
    }),
});

// Schema para criação de usuário
export const usuarioSchema = usuarioBaseSchema.extend({
  tipo_usuario: z
    .enum(['admin', 'gestor', 'diretor', 'professor', 'aluno'])
    .default('aluno'),
  empresa_id: z
    .number()
    .int()
    .positive('ID da empresa deve ser um número positivo')
    .optional(),
  escola_id: z
    .number()
    .int()
    .positive('ID da escola deve ser um número positivo')
    .optional(),
  status: z
    .enum(['ativo', 'inativo', 'pendente', 'bloqueado'])
    .default('ativo'),
  // Campos específicos por tipo
  disciplinas: z
    .array(z.string())
    .optional(), // Para professores
  formacao: z
    .string()
    .max(200, 'Formação não pode ter mais de 200 caracteres')
    .optional(), // Para professores
  cargo: z
    .string()
    .max(100, 'Cargo não pode ter mais de 100 caracteres')
    .optional(), // Para gestores/diretores
  matricula: z
    .string()
    .max(20, 'Matrícula não pode ter mais de 20 caracteres')
    .optional(), // Para alunos
  turma: z
    .string()
    .max(20, 'Turma não pode ter mais de 20 caracteres')
    .optional(), // Para alunos
  serie: z
    .string()
    .max(20, 'Série não pode ter mais de 20 caracteres')
    .optional(), // Para alunos
  nome_responsavel: z
    .string()
    .max(100, 'Nome do responsável não pode ter mais de 100 caracteres')
    .optional(), // Para alunos
  contato_responsavel: z
    .string()
    .optional()
    .refine((phone) => !phone || validatePhone(phone), {
      message: 'Contato do responsável deve ter um formato válido',
    }), // Para alunos
});

// Schema para atualização de usuário
export const usuarioUpdateSchema = usuarioBaseSchema.partial().extend({
  id: z
    .number()
    .int()
    .positive('ID deve ser um número positivo'),
  status: z
    .enum(['ativo', 'inativo', 'pendente', 'bloqueado'])
    .optional(),
  // Campos específicos por tipo (opcionais para atualização)
  disciplinas: z
    .array(z.string())
    .optional(),
  formacao: z
    .string()
    .max(200, 'Formação não pode ter mais de 200 caracteres')
    .optional(),
  cargo: z
    .string()
    .max(100, 'Cargo não pode ter mais de 100 caracteres')
    .optional(),
  matricula: z
    .string()
    .max(20, 'Matrícula não pode ter mais de 20 caracteres')
    .optional(),
  turma: z
    .string()
    .max(20, 'Turma não pode ter mais de 20 caracteres')
    .optional(),
  serie: z
    .string()
    .max(20, 'Série não pode ter mais de 20 caracteres')
    .optional(),
  nome_responsavel: z
    .string()
    .max(100, 'Nome do responsável não pode ter mais de 100 caracteres')
    .optional(),
  contato_responsavel: z
    .string()
    .optional()
    .refine((phone) => !phone || validatePhone(phone), {
      message: 'Contato do responsável deve ter um formato válido',
    }),
});

// Schema para perfil do usuário (dados que o próprio usuário pode editar)
export const perfilSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode ter mais de 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  phone: z
    .string()
    .optional()
    .refine((phone) => !phone || validatePhone(phone), {
      message: 'Telefone deve ter um formato válido (DD) XXXXX-XXXX',
    }),
  birth_date: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 120;
    }, {
      message: 'Data de nascimento deve ser válida',
    }),
  address: z
    .string()
    .max(200, 'Endereço não pode ter mais de 200 caracteres')
    .optional(),
  city: z
    .string()
    .max(100, 'Cidade não pode ter mais de 100 caracteres')
    .optional(),
  state: z
    .string()
    .length(2, 'Estado deve ter 2 caracteres (UF)')
    .optional(),
  cep: z
    .string()
    .optional()
    .refine((cep) => {
      if (!cep) return true;
      const cleanCEP = cep.replace(/\D/g, '');
      return cleanCEP.length === 8;
    }, {
      message: 'CEP deve ter 8 dígitos',
    }),
});

// Schema para busca de usuários
export const usuarioBuscaSchema = z.object({
  search: z.string().optional(),
  tipo_usuario: z.enum(['admin', 'gestor', 'diretor', 'professor', 'aluno']).optional(),
  status: z.enum(['ativo', 'inativo', 'pendente', 'bloqueado']).optional(),
  empresa_id: z.number().int().positive().optional(),
  escola_id: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  orderBy: z.enum(['name', 'email', 'created_at', 'tipo_usuario']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// Tipos TypeScript derivados dos schemas
export type UsuarioFormData = z.infer<typeof usuarioSchema>;
export type UsuarioUpdateFormData = z.infer<typeof usuarioUpdateSchema>;
export type PerfilFormData = z.infer<typeof perfilSchema>;
export type UsuarioBuscaFormData = z.infer<typeof usuarioBuscaSchema>;