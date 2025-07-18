import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Table, Key, Link, HardDrive } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DatabaseInfo {
  name: string;
  user: string;
  version: string;
  sizeInMB: string;
}

interface TableInfo {
  name: string;
  schema: string;
  owner: string;
  recordCount: string | number;
}

interface DatabaseResponse {
  success: boolean;
  database: DatabaseInfo;
  statistics: {
    totalTables: number;
    totalIndexes: number;
    totalForeignKeys: number;
  };
  tables: TableInfo[];
  recordCounts: Record<string, number | string>;
  timestamp: string;
}

export default function DatabaseTables() {
  const [data, setData] = useState<DatabaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/database/tables');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tabelas');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando informações do banco de dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar dados: {error}
          </AlertDescription>
        </Alert>
        <Button onClick={fetchTables} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tabelas do Banco de Dados</h1>
          <p className="text-muted-foreground">Aurora Serverless PostgreSQL</p>
        </div>
        <Button onClick={fetchTables} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Database Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Informações do Banco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-semibold">{data.database.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usuário</p>
              <p className="font-semibold">{data.database.user}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Versão</p>
              <p className="font-semibold">{data.database.version}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tamanho</p>
              <p className="font-semibold">{data.database.sizeInMB} MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Table className="h-4 w-4" />
              Tabelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.statistics.totalTables}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-4 w-4" />
              Índices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.statistics.totalIndexes}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link className="h-4 w-4" />
              Foreign Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.statistics.totalForeignKeys}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tabelas</CardTitle>
          <CardDescription>
            Todas as tabelas do schema public com contagem de registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tabela</th>
                  <th className="text-left p-2">Schema</th>
                  <th className="text-left p-2">Owner</th>
                  <th className="text-right p-2">Registros</th>
                </tr>
              </thead>
              <tbody>
                {data.tables.map((table) => (
                  <tr key={table.name} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4 text-muted-foreground" />
                        {table.name}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant="secondary">{table.schema}</Badge>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {table.owner}
                    </td>
                    <td className="p-2 text-right">
                      {table.recordCount === 'N/A' ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <Badge variant={Number(table.recordCount) > 0 ? 'default' : 'outline'}>
                          {table.recordCount}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Última atualização: {new Date(data.timestamp).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}