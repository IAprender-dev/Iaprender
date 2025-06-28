import axios from 'axios';

interface EscolaINEP {
  codigo_escola: string;
  nome_escola: string;
  codigo_municipio: string;
  municipio: string;
  uf: string;
  rede: string;
  ideb_ai: number;
  ideb_af: number;
  ideb_em: number;
  meta_ai: number;
  meta_af: number;
  meta_em: number;
}

interface EscolaFormatada {
  nomeEscola: string;
  tipoEscola: string;
  inep: string;
  cnpj: string;
  nomeDiretor: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  zona: string;
  dataFundacao: string;
  numeroSalas: number;
  numeroAlunos: number;
  status: string;
}

class APIINEPReal {
  private baseURL = 'http://api.dadosabertosinep.org/v1';
  private timeout = 10000; // 10 segundos

  /**
   * Valida se o código INEP tem formato correto
   */
  validarCodigoINEP(codigo: string): boolean {
    return /^\d{8}$/.test(codigo.replace(/\D/g, ''));
  }

  /**
   * Valida se o CNPJ tem formato correto
   */
  validarCNPJ(cnpj: string): boolean {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return cnpjLimpo.length === 14;
  }

  /**
   * Busca escola por código INEP na API oficial de dados abertos
   */
  async buscarPorCodigoINEP(codigoInep: string): Promise<EscolaFormatada | null> {
    try {
      console.log(`🏫 Consultando escola INEP ${codigoInep} na API oficial...`);
      
      const response = await axios.get(`${this.baseURL}/ideb/escola/${codigoInep}.json`, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'IAverse-Educational-Platform'
        }
      });

      if (response.data && response.data.codigo_escola) {
        console.log(`✅ Escola encontrada na API oficial: ${response.data.nome_escola}`);
        return this.formatarEscolaOficial(response.data);
      }

      console.log(`❌ Escola INEP ${codigoInep} não encontrada na API oficial`);
      return null;

    } catch (error: any) {
      console.error(`❌ Erro ao consultar API oficial do INEP:`, error.message);
      
      // Fallback: buscar em todas as escolas de um estado
      return await this.buscarPorCodigoEmTodosEstados(codigoInep);
    }
  }

  /**
   * Busca escola por CNPJ (limitado - API não tem CNPJ direto)
   */
  async buscarPorCNPJ(cnpj: string): Promise<EscolaFormatada | null> {
    console.log(`🏢 Busca por CNPJ não suportada pela API oficial do INEP`);
    return null;
  }

  /**
   * Busca escola percorrendo todos os estados (fallback)
   */
  private async buscarPorCodigoEmTodosEstados(codigoInep: string): Promise<EscolaFormatada | null> {
    const estados = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    for (const uf of estados) {
      try {
        console.log(`🔍 Buscando escola ${codigoInep} no estado ${uf}...`);
        
        const response = await axios.get(`${this.baseURL}/ideb/escolas.json`, {
          params: { uf },
          timeout: this.timeout
        });

        if (response.data && Array.isArray(response.data)) {
          const escola = response.data.find((e: any) => e.codigo_escola === codigoInep);
          if (escola) {
            console.log(`✅ Escola encontrada no estado ${uf}: ${escola.nome_escola}`);
            return this.formatarEscolaOficial(escola);
          }
        }
      } catch (error) {
        console.log(`⚠️ Erro ao buscar no estado ${uf}, continuando...`);
        continue;
      }
    }

    console.log(`❌ Escola ${codigoInep} não encontrada em nenhum estado`);
    return null;
  }

  /**
   * Formata dados da API oficial para o formato esperado
   */
  private formatarEscolaOficial(escola: EscolaINEP): EscolaFormatada {
    // Mapear rede para tipo de escola
    const tipoEscolaMapa: { [key: string]: string } = {
      'municipal': 'municipal',
      'estadual': 'estadual', 
      'federal': 'federal',
      'publica': 'pública',
      'privada': 'particular'
    };

    return {
      nomeEscola: escola.nome_escola || 'Nome não informado',
      tipoEscola: tipoEscolaMapa[escola.rede?.toLowerCase()] || 'municipal',
      inep: escola.codigo_escola,
      cnpj: '', // API não fornece CNPJ
      nomeDiretor: 'Diretor não informado na base do INEP',
      endereco: `Endereço não informado na base do INEP`,
      bairro: 'Bairro não informado',
      cidade: escola.municipio || 'Município não informado',
      estado: escola.uf || 'UF não informada',
      cep: '', // API não fornece CEP
      telefone: '', // API não fornece telefone
      email: '', // API não fornece email
      zona: escola.rede === 'municipal' ? 'urbana' : 'urbana', // Inferência básica
      dataFundacao: '', // API não fornece data de fundação
      numeroSalas: 0, // API não fornece número de salas
      numeroAlunos: 0, // API não fornece número de alunos
      status: 'ativa'
    };
  }

  /**
   * Busca escolas por UF para listagem
   */
  async buscarEscolasPorUF(uf: string): Promise<EscolaINEP[]> {
    try {
      console.log(`🏫 Buscando escolas do estado ${uf}...`);
      
      const response = await axios.get(`${this.baseURL}/ideb/escolas.json`, {
        params: { uf },
        timeout: this.timeout
      });

      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Encontradas ${response.data.length} escolas em ${uf}`);
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error(`❌ Erro ao buscar escolas de ${uf}:`, error.message);
      return [];
    }
  }

  /**
   * Busca resumo do IDEB por UF
   */
  async buscarResumoIDEB(uf: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/ideb.json`, {
        params: { uf },
        timeout: this.timeout
      });

      return response.data || null;
    } catch (error: any) {
      console.error(`❌ Erro ao buscar resumo IDEB de ${uf}:`, error.message);
      return null;
    }
  }
}

export const apiINEPReal = new APIINEPReal();