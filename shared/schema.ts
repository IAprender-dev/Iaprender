import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums básicos (mantidos para evitar erros de compilação)
export const userRoleEnum = pgEnum('user_role', ['admin', 'municipal_manager', 'school_director', 'teacher', 'student']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended', 'blocked']);
export const contractStatusEnum = pgEnum('contract_status', ['active', 'pending', 'expired', 'cancelled']);
export const cognitoGroupEnum = pgEnum('cognito_group', ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos']);

// Schema vazio - todas as tabelas foram removidas
// Será reescrito conforme necessário