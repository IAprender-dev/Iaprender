import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

const router = Router();

// GET /api/database/tables - Listar todas as tabelas do banco
router.get('/api/database/tables', async (req: Request, res: Response) => {
  try {
    console.log('📊 Listando tabelas do Aurora Serverless...');
    
    // Query para listar todas as tabelas
    const tablesQuery = sql`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    const tables = await db.execute(tablesQuery);
    
    // Query para contar registros de cada tabela principal
    const counts: any = {};
    const mainTables = ['usuarios', 'empresas', 'contratos', 'escolas', 'alunos', 'professores', 'diretores', 'gestores'];
    
    for (const tableName of mainTables) {
      try {
        const countQuery = sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`);
        const result = await db.execute(countQuery);
        counts[tableName] = result.rows[0].count;
      } catch (err) {
        counts[tableName] = 'N/A';
      }
    }
    
    // Query para informações do banco
    const dbInfoQuery = sql`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version,
        pg_database_size(current_database()) as size_bytes
    `;
    
    const dbInfo = await db.execute(dbInfoQuery);
    const info = dbInfo.rows[0];
    const sizeInMB = (parseInt(info.size_bytes as string) / 1024 / 1024).toFixed(2);
    
    // Query para contar índices
    const indexCountQuery = sql`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;
    
    const indexCount = await db.execute(indexCountQuery);
    
    // Query para contar foreign keys
    const fkCountQuery = sql`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
    `;
    
    const fkCount = await db.execute(fkCountQuery);
    
    res.json({
      success: true,
      database: {
        name: info.database,
        user: info.user,
        version: (info.version as string).split(',')[0],
        sizeInMB: sizeInMB
      },
      statistics: {
        totalTables: tables.rows.length,
        totalIndexes: indexCount.rows[0].count,
        totalForeignKeys: fkCount.rows[0].count
      },
      tables: tables.rows.map((row: any) => ({
        name: row.tablename,
        schema: row.schemaname,
        owner: row.tableowner,
        recordCount: counts[row.tablename] || 'N/A'
      })),
      recordCounts: counts,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar tabelas do banco',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;