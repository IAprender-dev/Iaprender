import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Building2, Users, School, FileText, DollarSign, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface Contract {
  id: number;
  contractNumber: string;
  schoolName: string;
  contractType: string;
  licenseCount: number;
  monthlyValue: number;
  startDate: string;
  endDate: string;
  status: string;
  companyName: string;
}

const ContractManagement = () => {
  const [, setLocation] = useLocation();

  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['/api/municipal/contracts/filtered'],
  });

  const contracts = contractsData?.contracts || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'inativo':
        return 'bg-red-100 text-red-800';
      case 'suspenso':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setLocation('/gestor/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-3">
                <img 
                  src="/attached_assets/IAprender_1750262377399.png" 
                  alt="IAprender Logo" 
                  className="h-8 w-8 rounded bg-white shadow-sm"
                />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Gestão de Contratos
                  </h1>
                  <p className="text-gray-600">Visualize e gerencie todos os contratos da sua empresa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
                  <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {contracts.filter((c: Contract) => c.status === 'ativo').length}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Licenças</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {contracts.reduce((sum: number, contract: Contract) => sum + contract.licenseCount, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Mensal Total</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(contracts.reduce((sum: number, contract: Contract) => sum + contract.monthlyValue, 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract: Contract) => (
            <Card key={contract.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {contract.schoolName}
                  </CardTitle>
                  <Badge className={getStatusColor(contract.status)}>
                    {contract.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">#{contract.contractNumber}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{contract.companyName}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{contract.licenseCount} licenças</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">{formatCurrency(contract.monthlyValue)}/mês</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">Tipo de Contrato</p>
                  <p className="text-sm text-gray-900">{contract.contractType}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {contracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
            <p className="text-gray-600">Não há contratos cadastrados para sua empresa.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractManagement;