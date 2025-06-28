import axios from 'axios';

interface EscolaBaseDados {
  codigo_escola: string;
  nome_escola: string;
  codigo_municipio: string;
  municipio: string;
  sigla_uf: string;
  rede: string;
  localizacao: string;
  categoria_escola_privada?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  telefone?: string;
  email?: string;
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

class BaseDadosINEP {
  private baseURL = 'https://api.basedosdados.org/api/v1/graphql';
  private timeout = 15000; // 15 segundos

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
   * Busca escola por código INEP via API GraphQL da Base dos Dados
   */
  async buscarPorCodigoINEP(codigoInep: string): Promise<EscolaFormatada | null> {
    try {
      console.log(`🏫 Consultando escola INEP ${codigoInep} na Base dos Dados...`);
      
      const query = `
        query {
          allBrInepCensoEscolarEscola(
            condition: { codigoEscola: "${codigoInep}" }
            first: 1
          ) {
            nodes {
              codigoEscola
              nomeEscola
              codigoMunicipio
              municipio
              siglaUf
              rede
              localizacao
              categoriaEscolaPrivada
              endereco
              numero
              complemento
              bairro
              cep
              telefone
              email
            }
          }
        }
      `;

      const response = await axios.post(this.baseURL, {
        query: query
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'IAverse-Educational-Platform'
        }
      });

      if (response.data?.data?.allBrInepCensoEscolarEscola?.nodes?.length > 0) {
        const escola = response.data.data.allBrInepCensoEscolarEscola.nodes[0];
        console.log(`✅ Escola encontrada na Base dos Dados: ${escola.nomeEscola}`);
        return this.formatarEscolaBaseDados(escola);
      }

      console.log(`❌ Escola INEP ${codigoInep} não encontrada na Base dos Dados`);
      return null;

    } catch (error: any) {
      console.error(`❌ Erro ao consultar Base dos Dados:`, error.message);
      return null;
    }
  }

  /**
   * Busca escola por CNPJ (funcionalidade limitada)
   */
  async buscarPorCNPJ(cnpj: string): Promise<EscolaFormatada | null> {
    console.log(`🏢 Busca por CNPJ não suportada pela Base dos Dados do INEP`);
    return null;
  }

  /**
   * Formata dados da Base dos Dados para o formato esperado
   */
  private formatarEscolaBaseDados(escola: any): EscolaFormatada {
    // Mapear rede para tipo de escola
    const tipoEscolaMapa: { [key: string]: string } = {
      'Municipal': 'municipal',
      'Estadual': 'estadual', 
      'Federal': 'federal',
      'Privada': 'particular'
    };

    // Mapear localização para zona
    const zonaMapa: { [key: string]: string } = {
      'Urbana': 'urbana',
      'Rural': 'rural'
    };

    // Construir endereço completo
    let enderecoCompleto = escola.endereco || '';
    if (escola.numero) {
      enderecoCompleto += `, ${escola.numero}`;
    }
    if (escola.complemento) {
      enderecoCompleto += `, ${escola.complemento}`;
    }

    return {
      nomeEscola: escola.nomeEscola || 'Nome não informado',
      tipoEscola: tipoEscolaMapa[escola.rede] || 'municipal',
      inep: escola.codigoEscola,
      cnpj: '', // Base dos Dados não fornece CNPJ para escolas
      nomeDiretor: 'Informação não disponível nos microdados públicos',
      endereco: enderecoCompleto || 'Endereço não informado',
      bairro: escola.bairro || 'Bairro não informado',
      cidade: escola.municipio || 'Município não informado',
      estado: escola.siglaUf || 'UF não informada',
      cep: escola.cep?.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2') || '',
      telefone: escola.telefone || '',
      email: escola.email || '',
      zona: zonaMapa[escola.localizacao] || 'urbana',
      dataFundacao: '', // Informação não disponível nos microdados
      numeroSalas: 0, // Informação não disponível nos microdados básicos
      numeroAlunos: 0, // Informação não disponível nos microdados básicos
      status: 'ativa'
    };
  }

  /**
   * Busca estatísticas da escola (dados complementares)
   */
  async buscarEstatisticasEscola(codigoInep: string): Promise<any> {
    try {
      console.log(`📊 Buscando estatísticas da escola ${codigoInep}...`);
      
      const query = `
        query {
          allBrInepCensoEscolarMatricula(
            condition: { codigoEscola: "${codigoInep}" }
            first: 1000
          ) {
            totalCount
          }
        }
      `;

      const response = await axios.post(this.baseURL, {
        query: query
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data?.data?.allBrInepCensoEscolarMatricula?.totalCount || 0;

    } catch (error: any) {
      console.error(`❌ Erro ao buscar estatísticas:`, error.message);
      return 0;
    }
  }

  /**
   * Busca escolas por UF para listagem
   */
  async buscarEscolasPorUF(uf: string, limite: number = 100): Promise<any[]> {
    try {
      console.log(`🏫 Buscando escolas do estado ${uf}...`);
      
      const query = `
        query {
          allBrInepCensoEscolarEscola(
            condition: { siglaUf: "${uf.toUpperCase()}" }
            first: ${limite}
          ) {
            nodes {
              codigoEscola
              nomeEscola
              municipio
              rede
              localizacao
            }
          }
        }
      `;

      const response = await axios.post(this.baseURL, {
        query: query
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const escolas = response.data?.data?.allBrInepCensoEscolarEscola?.nodes || [];
      console.log(`✅ Encontradas ${escolas.length} escolas em ${uf}`);
      return escolas;

    } catch (error: any) {
      console.error(`❌ Erro ao buscar escolas de ${uf}:`, error.message);
      return [];
    }
  }
}

export const baseDadosINEP = new BaseDadosINEP();