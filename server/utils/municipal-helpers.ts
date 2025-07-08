import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export async function getUserCompanyInfo(userId: number) {
  try {
    const [user] = await db
      .select({
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.companyId) {
      throw new Error(`User ${userId} não possui empresa vinculada`);
    }

    return user;
  } catch (error) {
    console.error(`❌ Erro ao buscar empresa do usuário ${userId}:`, error);
    throw error;
  }
}