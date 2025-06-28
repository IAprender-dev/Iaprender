import fs from 'fs';
import path from 'path';

export interface EscolaINEP {
  codigo_inep: string;
  cnpj: string;
  nome_escola: string;
  tipo_escola: 'municipal' | 'estadual' | 'federal' | 'particular';
  dependencia_administrativa: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  zona: 'urbana' | 'rural';
  nome_diretor: string;
  data_fundacao: string;
  numero_salas: number;
  numero_alunos: number;
  modalidades: string[];
  infraestrutura: {
    biblioteca?: boolean;
    laboratorio_informatica?: boolean;
    laboratorio_ciencias?: boolean;
    laboratorio_fisica?: boolean;
    laboratorio_quimica?: boolean;
    quadra_esportes?: boolean;
    playground?: boolean;
    internet?: boolean;
    agua_filtrada?: boolean;
    energia_eletrica?: boolean;
    esgoto_rede_publica?: boolean;
    poco_artesiano?: boolean;
    auditorio?: boolean;
  };
  coordenadas: {
    latitude: number;
    longitude: number;
  };
}

class INEPService {
  private escolas: EscolaINEP[] = [];
  private initialized = false;

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      // Caminho relativo a partir da raiz do projeto
      const dataPath = path.resolve(process.cwd(), 'server/data/escolas-inep.json');
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      this.escolas = JSON.parse(rawData);
      this.initialized = true;
      console.log(`✅ Dados do INEP carregados: ${this.escolas.length} escolas`);
    } catch (error) {
      console.error('❌ Erro ao carregar dados do INEP:', error);
      console.error('❌ Tentando caminho:', path.resolve(process.cwd(), 'server/data/escolas-inep.json'));
      this.escolas = [];
    }
  }

  /**
   * Busca escola por código INEP
   */
  public buscarPorCodigoINEP(codigoINEP: string): EscolaINEP | null {
    if (!this.initialized) {
      this.loadData();
    }

    const escola = this.escolas.find(e => e.codigo_inep === codigoINEP);
    return escola || null;
  }

  /**
   * Busca escola por CNPJ
   */
  public buscarPorCNPJ(cnpj: string): EscolaINEP | null {
    if (!this.initialized) {
      this.loadData();
    }

    // Remove formatação do CNPJ se houver
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    const escola = this.escolas.find(e => {
      const escolaCnpj = e.cnpj.replace(/[^\d]/g, '');
      return escolaCnpj === cnpjLimpo;
    });
    
    return escola || null;
  }

  /**
   * Busca escolas por filtros
   */
  public buscarPorFiltros(filtros: {
    estado?: string;
    cidade?: string;
    tipo_escola?: string;
    zona?: string;
  }): EscolaINEP[] {
    if (!this.initialized) {
      this.loadData();
    }

    let resultado = this.escolas;

    if (filtros.estado) {
      resultado = resultado.filter(e => 
        e.estado.toLowerCase() === filtros.estado!.toLowerCase()
      );
    }

    if (filtros.cidade) {
      resultado = resultado.filter(e => 
        e.cidade.toLowerCase().includes(filtros.cidade!.toLowerCase())
      );
    }

    if (filtros.tipo_escola) {
      resultado = resultado.filter(e => 
        e.tipo_escola === filtros.tipo_escola
      );
    }

    if (filtros.zona) {
      resultado = resultado.filter(e => 
        e.zona === filtros.zona
      );
    }

    return resultado;
  }

  /**
   * Busca por nome da escola (busca parcial)
   */
  public buscarPorNome(nome: string): EscolaINEP[] {
    if (!this.initialized) {
      this.loadData();
    }

    const nomeMinusculo = nome.toLowerCase();
    return this.escolas.filter(e => 
      e.nome_escola.toLowerCase().includes(nomeMinusculo)
    );
  }

  /**
   * Retorna todas as escolas (com paginação opcional)
   */
  public listarTodas(limite?: number, offset?: number): {
    escolas: EscolaINEP[];
    total: number;
  } {
    if (!this.initialized) {
      this.loadData();
    }

    const total = this.escolas.length;
    let escolas = this.escolas;

    if (offset) {
      escolas = escolas.slice(offset);
    }

    if (limite) {
      escolas = escolas.slice(0, limite);
    }

    return { escolas, total };
  }

  /**
   * Converte dados da escola do INEP para formato do nosso sistema
   */
  public converterParaEscolaLocal(escolaINEP: EscolaINEP): any {
    return {
      nomeEscola: escolaINEP.nome_escola,
      tipoEscola: escolaINEP.tipo_escola,
      inep: escolaINEP.codigo_inep,
      cnpj: escolaINEP.cnpj,
      nomeDiretor: escolaINEP.nome_diretor,
      endereco: escolaINEP.endereco,
      bairro: escolaINEP.bairro,
      cidade: escolaINEP.cidade,
      estado: escolaINEP.estado,
      cep: escolaINEP.cep,
      telefone: escolaINEP.telefone,
      email: escolaINEP.email,
      zona: escolaINEP.zona,
      dataFundacao: escolaINEP.data_fundacao,
      numeroSalas: escolaINEP.numero_salas,
      numeroAlunos: escolaINEP.numero_alunos,
      status: 'ativa'
    };
  }

  /**
   * Valida código INEP
   */
  public validarCodigoINEP(codigo: string): boolean {
    // Código INEP tem 8 dígitos
    return /^\d{8}$/.test(codigo);
  }

  /**
   * Valida CNPJ
   */
  public validarCNPJ(cnpj: string): boolean {
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    return cnpjLimpo.length === 14;
  }
}

// Instância singleton
export const inepService = new INEPService();