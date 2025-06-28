import { externalAPIService, ExternalSchoolData } from './external-apis';

class RealINEPService {
  /**
   * Busca escola por código INEP usando APIs externas reais
   */
  async buscarPorCodigoINEP(codigo: string): Promise<ExternalSchoolData | null> {
    console.log(`🏫 Iniciando busca por código INEP: ${codigo}`);
    
    try {
      // Valida formato do código INEP
      const codigoLimpo = codigo.replace(/\D/g, '');
      if (codigoLimpo.length !== 8) {
        throw new Error('Código INEP deve ter 8 dígitos');
      }

      // Consulta APIs externas para encontrar a escola
      const dadosEscola = await externalAPIService.consultarEscolaPorINEP(codigoLimpo);
      
      if (dadosEscola) {
        console.log(`✅ Escola encontrada via API externa: ${dadosEscola.nomeEscola}`);
        return dadosEscola;
      } else {
        console.log(`❌ Escola com código INEP ${codigo} não encontrada em APIs externas`);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Erro ao buscar escola por INEP ${codigo}:`, error.message);
      return null;
    }
  }

  /**
   * Busca escola por CNPJ usando APIs externas reais
   */
  async buscarPorCNPJ(cnpj: string): Promise<ExternalSchoolData | null> {
    console.log(`🏫 Iniciando busca por CNPJ: ${cnpj}`);
    
    try {
      // Valida formato do CNPJ
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      if (cnpjLimpo.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
      }

      // Consulta APIs externas para encontrar a escola
      const dadosEscola = await externalAPIService.consultarEscolaPorCNPJ(cnpj);
      
      if (dadosEscola) {
        console.log(`✅ Escola encontrada via consulta CNPJ: ${dadosEscola.nomeEscola}`);
        return dadosEscola;
      } else {
        console.log(`❌ Escola com CNPJ ${cnpj} não encontrada ou não é instituição de ensino`);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Erro ao buscar escola por CNPJ ${cnpj}:`, error.message);
      return null;
    }
  }

  /**
   * Formata dados da escola para resposta da API
   */
  formatarDadosEscola(escola: ExternalSchoolData) {
    return {
      nomeEscola: escola.nomeEscola,
      tipoEscola: escola.tipoEscola,
      inep: escola.inep || '',
      cnpj: escola.cnpj || '',
      nomeDiretor: escola.nomeDiretor || '',
      endereco: escola.endereco,
      bairro: escola.bairro,
      cidade: escola.cidade,
      estado: escola.estado,
      cep: escola.cep,
      telefone: escola.telefone || '',
      email: escola.email || '',
      zona: escola.zona || '',
      dataFundacao: escola.dataFundacao || '',
      numeroSalas: escola.numeroSalas || 0,
      numeroAlunos: escola.numeroAlunos || 0,
      status: escola.status
    };
  }

  /**
   * Valida código INEP
   */
  validarCodigoINEP(codigo: string): boolean {
    const codigoLimpo = codigo.replace(/\D/g, '');
    return codigoLimpo.length === 8;
  }

  /**
   * Valida CNPJ
   */
  validarCNPJ(cnpj: string): boolean {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return cnpjLimpo.length === 14;
  }
}

export const realINEPService = new RealINEPService();