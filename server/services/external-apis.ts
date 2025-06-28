import axios from 'axios';

// Interface para dados de escola retornados por APIs externas
export interface ExternalSchoolData {
  nomeEscola: string;
  tipoEscola: string;
  inep?: string;
  cnpj?: string;
  nomeDiretor?: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone?: string;
  email?: string;
  zona?: string;
  dataFundacao?: string;
  numeroSalas?: number;
  numeroAlunos?: number;
  status: string;
}

// Interface para resposta de CEP da BrasilAPI
interface BrasilAPICepResponse {
  cep: string;
  state: string;
  city: string;
  district: string;
  street: string;
}

// Interface para resposta de CNPJ
interface CNPJResponse {
  cnpj: string;
  identificador_matriz_filial: number;
  descricao_matriz_filial: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: number;
  nome_cidade_exterior: string;
  codigo_natureza_juridica: number;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  descricao_tipo_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  codigo_municipio: number;
  municipio: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  ddd_fax: string;
  qualificacao_do_responsavel: number;
  capital_social: number;
  porte: number;
  descricao_porte: string;
  opcao_pelo_simples: boolean;
  data_opcao_pelo_simples: string;
  data_exclusao_do_simples: string;
  opcao_pelo_mei: boolean;
  situacao_especial: string;
  data_situacao_especial: string;
}

class ExternalAPIService {
  private readonly BRASIL_API_BASE = 'https://brasilapi.com.br/api';
  private readonly RECEITAWS_BASE = 'https://receitaws.com.br/v1';
  
  // Timeout para requisições externas
  private readonly REQUEST_TIMEOUT = 10000; // 10 segundos

  /**
   * Consulta dados de CEP usando BrasilAPI
   */
  async consultarCEP(cep: string): Promise<BrasilAPICepResponse | null> {
    try {
      console.log(`📍 Consultando CEP ${cep} na BrasilAPI...`);
      
      // Remove caracteres não numéricos do CEP
      const cepLimpo = cep.replace(/\D/g, '');
      
      if (cepLimpo.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      const response = await axios.get(
        `${this.BRASIL_API_BASE}/cep/v1/${cepLimpo}`,
        { timeout: this.REQUEST_TIMEOUT }
      );

      console.log(`✅ CEP encontrado: ${response.data.city}/${response.data.state}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao consultar CEP ${cep}:`, error.message);
      return null;
    }
  }

  /**
   * Consulta dados de CNPJ usando ReceitaWS
   */
  async consultarCNPJ(cnpj: string): Promise<CNPJResponse | null> {
    try {
      console.log(`🏢 Consultando CNPJ ${cnpj} na ReceitaWS...`);
      
      // Remove caracteres não numéricos do CNPJ
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      
      if (cnpjLimpo.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
      }

      const response = await axios.get(
        `${this.RECEITAWS_BASE}/cnpj/${cnpjLimpo}`,
        { timeout: this.REQUEST_TIMEOUT }
      );

      if (response.data.status === 'ERROR') {
        throw new Error(response.data.message || 'CNPJ não encontrado');
      }

      console.log(`✅ CNPJ encontrado: ${response.data.nome}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erro ao consultar CNPJ ${cnpj}:`, error.message);
      return null;
    }
  }

  /**
   * Consulta dados de escola por código INEP usando API externa
   * Simula consulta real ao catálogo do INEP
   */
  async consultarEscolaPorINEP(codigoInep: string): Promise<ExternalSchoolData | null> {
    try {
      console.log(`🏫 Consultando escola INEP ${codigoInep} em APIs externas...`);
      
      // Para este exemplo, vou consultar um serviço que retorna dados baseados no código INEP
      // Em produção, isso seria uma API real do INEP ou parceiros
      const response = await this.buscarEscolaEmAPIs(codigoInep);
      
      if (response) {
        console.log(`✅ Escola encontrada: ${response.nomeEscola}`);
        return response;
      } else {
        console.log(`❌ Escola INEP ${codigoInep} não encontrada em APIs externas`);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Erro ao consultar escola INEP ${codigoInep}:`, error.message);
      return null;
    }
  }

  /**
   * Consulta dados de escola por CNPJ usando API externa
   */
  async consultarEscolaPorCNPJ(cnpj: string): Promise<ExternalSchoolData | null> {
    try {
      console.log(`🏫 Consultando escola por CNPJ ${cnpj} em APIs externas...`);
      
      // Primeiro consulta dados do CNPJ na Receita Federal
      const dadosCNPJ = await this.consultarCNPJ(cnpj);
      
      if (!dadosCNPJ) {
        return null;
      }

      // Verifica se é uma instituição de ensino
      const isEscola = this.verificarSeEhEscola(dadosCNPJ);
      
      if (!isEscola) {
        throw new Error('CNPJ não corresponde a uma instituição de ensino');
      }

      // Consulta dados de CEP para complementar endereço
      const dadosCEP = await this.consultarCEP(dadosCNPJ.cep);

      // Monta dados da escola baseado nos dados reais do CNPJ
      const dadosEscola: ExternalSchoolData = {
        nomeEscola: dadosCNPJ.nome_fantasia || dadosCNPJ.razao_social,
        tipoEscola: this.determinarTipoEscola(dadosCNPJ),
        cnpj: cnpj,
        endereco: `${dadosCNPJ.descricao_tipo_logradouro} ${dadosCNPJ.logradouro}, ${dadosCNPJ.numero}`,
        bairro: dadosCNPJ.bairro,
        cidade: dadosCNPJ.municipio,
        estado: dadosCNPJ.uf,
        cep: dadosCNPJ.cep,
        telefone: dadosCNPJ.ddd_telefone_1 ? `(${dadosCNPJ.ddd_telefone_1.substring(0,2)}) ${dadosCNPJ.ddd_telefone_1.substring(2)}` : undefined,
        dataFundacao: dadosCNPJ.data_inicio_atividade,
        status: dadosCNPJ.descricao_situacao_cadastral.toLowerCase() === 'ativa' ? 'ativa' : 'inativa'
      };

      console.log(`✅ Dados da escola extraídos do CNPJ: ${dadosEscola.nomeEscola}`);
      return dadosEscola;
    } catch (error: any) {
      console.error(`❌ Erro ao consultar escola por CNPJ ${cnpj}:`, error.message);
      return null;
    }
  }

  /**
   * Busca escola em múltiplas APIs externas por código INEP
   */
  private async buscarEscolaEmAPIs(codigoInep: string): Promise<ExternalSchoolData | null> {
    // Lista de APIs para tentar consultar dados de escola
    const apis = [
      // API Dados Abertos INEP (simulada - em produção seria real)
      () => this.consultarAPIINEP(codigoInep),
      // API Educação Inteligente (simulada)
      () => this.consultarAPIEducacao(codigoInep),
      // Outras APIs educacionais
    ];

    for (const apiCall of apis) {
      try {
        const resultado = await apiCall();
        if (resultado) {
          return resultado;
        }
      } catch (error) {
        console.log(`⚠️  API falhou, tentando próxima...`);
        continue;
      }
    }

    return null;
  }

  /**
   * Simula consulta à API do INEP (em produção seria uma API real)
   */
  private async consultarAPIINEP(codigoInep: string): Promise<ExternalSchoolData | null> {
    // Esta seria uma consulta real à API do INEP em produção
    // Para fins de demonstração, simulo uma consulta que falha ou retorna dados específicos
    
    if (codigoInep === '29015227') {
      return {
        nomeEscola: "EMEF Presidente Vargas",
        tipoEscola: "municipal",
        inep: "29015227",
        cnpj: "02.094.904/0001-59",
        nomeDiretor: "Ana Maria da Silva",
        endereco: "Rua das Palmeiras, 789",
        bairro: "Centro",
        cidade: "Brasília",
        estado: "DF",
        cep: "70040-010",
        telefone: "(61) 3344-5566",
        email: "presidente.vargas@se.df.gov.br",
        zona: "urbana",
        dataFundacao: "1980-04-15",
        numeroSalas: 15,
        numeroAlunos: 420,
        status: "ativa"
      };
    }

    // Para outros códigos, simula que não encontrou
    return null;
  }

  /**
   * Simula consulta à API Educação Inteligente
   */
  private async consultarAPIEducacao(codigoInep: string): Promise<ExternalSchoolData | null> {
    // Em produção seria uma consulta real à API
    // Por ora, retorna null para simular que não encontrou
    return null;
  }

  /**
   * Verifica se um CNPJ corresponde a uma instituição de ensino
   */
  private verificarSeEhEscola(dadosCNPJ: CNPJResponse): boolean {
    const atividadesEducacionais = [
      8511, 8512, 8513, 8520, 8531, 8532, 8533, 8541, 8542, 8550, 8591, 8592, 8593, 8599
    ];
    
    return atividadesEducacionais.includes(dadosCNPJ.cnae_fiscal);
  }

  /**
   * Determina o tipo de escola baseado nos dados do CNPJ
   */
  private determinarTipoEscola(dadosCNPJ: CNPJResponse): string {
    const naturezaJuridica = dadosCNPJ.codigo_natureza_juridica;
    
    // Códigos de natureza jurídica para determinar tipo
    if (naturezaJuridica >= 1000 && naturezaJuridica <= 1999) {
      return 'federal';
    } else if (naturezaJuridica >= 2000 && naturezaJuridica <= 2999) {
      return 'estadual';
    } else if (naturezaJuridica >= 3000 && naturezaJuridica <= 3999) {
      return 'municipal';
    } else {
      return 'particular';
    }
  }
}

export const externalAPIService = new ExternalAPIService();