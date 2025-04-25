import { parse } from 'csv-parse/sync';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { User, InsertUser } from '@shared/schema';
import { db } from '../db';
import { users } from '@shared/schema';

type CSVUserData = {
  firstName: string;
  lastName: string;
  email: string;
  username?: string;
  role: 'admin' | 'teacher' | 'student';
  contractId: number;
};

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length = 12): string {
  // Generate secure random bytes and convert to base64
  const randomString = randomBytes(Math.ceil(length * 0.75)).toString('base64').slice(0, length);
  
  // Ensure at least one of each character type
  const password = 
    randomString.substring(0, length - 3) + 
    (Math.random() < 0.5 ? 'A' : 'B') + // uppercase
    (Math.random() < 0.5 ? '2' : '3') + // number
    (Math.random() < 0.5 ? '!' : '#'); // special char
  
  return password;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Import users from CSV data
 */
export async function importUsersFromCSV(
  csvContent: string, 
  contractId: number,
  options = { generatePasswords: true }
): Promise<{ 
  success: User[]; 
  errors: { row: number; email: string; error: string }[];
  passwords: { email: string; password: string }[];
}> {
  // Parse CSV content
  const records = parse(csvContent, {
    columns: true,
    skipEmptyLines: true,
    trim: true,
  });

  const results = {
    success: [] as User[],
    errors: [] as { row: number; email: string; error: string }[],
    passwords: [] as { email: string; password: string }[],
  };

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    
    try {
      // Validate required fields
      if (!row.firstName || !row.lastName || !row.email || !row.role) {
        throw new Error('Missing required fields (firstName, lastName, email, role)');
      }

      // Format data
      const userData: CSVUserData = {
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        email: row.email.trim().toLowerCase(),
        role: row.role.trim().toLowerCase() as 'admin' | 'teacher' | 'student',
        contractId,
        username: row.username ? row.username.trim() : row.email.trim().toLowerCase().split('@')[0],
      };

      // Generate password if needed
      const password = options.generatePasswords ? generateSecurePassword() : row.password?.trim();
      
      if (!password) {
        throw new Error('Password is required');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const insertUser: InsertUser = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
        status: 'active',
        contractId,
        firstLogin: true,
        forcePasswordChange: true,
      };

      // Insert user into database
      const [newUser] = await db.insert(users).values(insertUser).returning();
      
      results.success.push(newUser);
      
      // Store the generated password for return
      if (options.generatePasswords) {
        results.passwords.push({
          email: userData.email,
          password,
        });
      }
    } catch (error: any) {
      results.errors.push({
        row: i + 2, // Adding 2 because 1 for header row and 1 for 1-based indexing
        email: row.email || 'unknown',
        error: error.message || 'Unknown error',
      });
    }
  }

  return results;
}