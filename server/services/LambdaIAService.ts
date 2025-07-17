import { 
  BedrockRuntimeClient, 
  InvokeModelCommand,
  BedrockRuntimeServiceException 
} from '@aws-sdk/client-bedrock-runtime';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  S3ServiceException 
} from '@aws-sdk/client-s3';
import { 
  DynamoDBClient, 
  PutItemCommand, 
  GetItemCommand, 
  QueryCommand,
  DynamoDBServiceException 
} from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { SecretsManager } from '../config/secrets.js';

export interface DocumentoIARequest {
  empresa_id: number;
  contrato_id?: number;
  escola_id?: number;
  usuario_id: number;
  tipo_usuario: string;
  prompt: string;
  nome_usuario: string;
  tipo_arquivo: string;
  modelo_bedrock?: string;
  max_tokens?: number;
  temperatura?: number;
  metadata?: Record<string, any>;
}

export interface DocumentoIAResponse {
  uuid: string;
  s3_key: string;
  conteudo_gerado: any;
  tokens_utilizados: number;
  tempo_geracao_ms: number;
  status: string;
  data_criacao: string;
}

export interface MetadadosDynamoDB {
  empresa_id: number;
  uuid: string;
  usuario_id: number;
  tipo_usuario: string;
  escola_id?: number;
  contrato_id?: number;
  data_criacao: string;
  tipo_arquivo: string;
  nome_usuario: string;
  s3_key: string;
  status: string;
  tokens_utilizados: number;
  tempo_geracao_ms: number;
  modelo_utilizado: string;
  prompt_hash: string;
  metadata?: Record<string, any>;
}

/**
 * Serviço para geração de documentos IA via Lambda
 * Integra AWS Bedrock, S3, DynamoDB e Aurora
 */
export class LambdaIAService {
  private bedrock: BedrockRuntimeClient;
  private s3: S3Client;
  private dynamodb: DynamoDBClient;
  private bucketName: string;
  private dynamoTableName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'iaprender-bucket';
    this.dynamoTableName = process.env.DYNAMO_TABLE_NAME || 'arquivos_metadados';
    
    this.inicializarClients();
  }

  private async inicializarClients() {
    try {
      const credentials = SecretsManager.getAWSCredentials();
      
      const config = {
        region: 'us-east-1',
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey
        }
      };

      this.bedrock = new BedrockRuntimeClient(config);
      this.s3 = new S3Client(config);
      this.dynamodb = new DynamoDBClient(config);
      
      console.log('✅ Lambda IA Service - Clientes AWS inicializados');
    } catch (error) {
      console.error('❌ Erro ao inicializar clientes AWS:', error);
      throw error;
    }
  }

  /**
   * Gera hash do prompt para deduplicação
   */
  private gerarHashPrompt(prompt: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(prompt).digest('hex');
  }

  /**
   * Gera S3 key baseada na hierarquia organizacional
   */
  private gerarS3Key(request: DocumentoIARequest, uuid: string): string {
    const { empresa_id, contrato_id, escola_id, usuario_id, tipo_usuario, tipo_arquivo } = request;
    
    let s3Key = `empresa-${empresa_id}`;
    
    if (contrato_id) {
      s3Key += `/contrato-${contrato_id}`;
    }
    
    if (escola_id) {
      s3Key += `/escola-${escola_id}`;
    }
    
    s3Key += `/${tipo_usuario}-${usuario_id}`;
    s3Key += `/ia-generated`;
    s3Key += `/${tipo_arquivo}`;
    s3Key += `/${uuid}.json`;
    
    return s3Key;
  }

  /**
   * Invoca modelo Bedrock para geração de conteúdo
   */
  private async invocarBedrock(request: DocumentoIARequest): Promise<{
    conteudo: any;
    tokens_utilizados: number;
    tempo_geracao_ms: number;
  }> {
    const inicioTempo = Date.now();
    
    try {
      const modelo = request.modelo_bedrock || 'anthropic.claude-3-haiku-20240307-v1:0';
      const maxTokens = request.max_tokens || 1000;
      const temperatura = request.temperatura || 0.7;

      // Preparar payload baseado no modelo
      let payload: any;
      
      if (modelo.includes('anthropic.claude')) {
        payload = {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: maxTokens,
          temperature: temperatura,
          messages: [
            {
              role: "user",
              content: request.prompt
            }
          ]
        };
      } else {
        // Fallback para outros modelos
        payload = {
          inputText: request.prompt,
          textGenerationConfig: {
            maxTokenCount: maxTokens,
            temperature: temperatura
          }
        };
      }

      const command = new InvokeModelCommand({
        modelId: modelo,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      });

      const response = await this.bedrock.send(command);
      const responseBody = JSON.parse(Buffer.from(response.body).toString('utf8'));
      
      const tempoGeracao = Date.now() - inicioTempo;
      
      // Extrair conteúdo baseado no modelo
      let conteudoGerado: any;
      let tokensUtilizados = 0;
      
      if (modelo.includes('anthropic.claude')) {
        conteudoGerado = responseBody.content[0].text;
        tokensUtilizados = responseBody.usage?.output_tokens || 0;
      } else {
        conteudoGerado = responseBody.results?.[0]?.outputText || responseBody;
        tokensUtilizados = responseBody.inputTextTokenCount || 0;
      }

      return {
        conteudo: conteudoGerado,
        tokens_utilizados: tokensUtilizados,
        tempo_geracao_ms: tempoGeracao
      };
      
    } catch (error) {
      console.error('❌ Erro ao invocar Bedrock:', error);
      
      if (error instanceof BedrockRuntimeServiceException) {
        throw new Error(`Erro Bedrock: ${error.message} (${error.name})`);
      }
      
      throw new Error(`Erro na geração IA: ${error.message}`);
    }
  }

  /**
   * Faz upload do documento para S3
   */
  private async uploadParaS3(s3Key: string, conteudo: any, metadata: Record<string, any>): Promise<void> {
    try {
      const comando = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: JSON.stringify(conteudo, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'generated-by': 'bedrock-ia',
          'content-type': 'ai-generated',
          ...Object.keys(metadata).reduce((acc, key) => {
            acc[key] = String(metadata[key]);
            return acc;
          }, {} as Record<string, string>)
        }
      });

      await this.s3.send(comando);
      console.log(`✅ Documento enviado para S3: ${s3Key}`);
      
    } catch (error) {
      console.error('❌ Erro ao fazer upload para S3:', error);
      
      if (error instanceof S3ServiceException) {
        throw new Error(`Erro S3: ${error.message} (${error.name})`);
      }
      
      throw new Error(`Erro no upload: ${error.message}`);
    }
  }

  /**
   * Registra metadados no DynamoDB
   */
  private async registrarNoDynamoDB(metadados: MetadadosDynamoDB): Promise<void> {
    try {
      const item = {
        empresa_id: { N: metadados.empresa_id.toString() },
        uuid: { S: metadados.uuid },
        usuario_id: { N: metadados.usuario_id.toString() },
        tipo_usuario: { S: metadados.tipo_usuario },
        data_criacao: { S: metadados.data_criacao },
        tipo_arquivo: { S: metadados.tipo_arquivo },
        nome_usuario: { S: metadados.nome_usuario },
        s3_key: { S: metadados.s3_key },
        status: { S: metadados.status },
        tokens_utilizados: { N: metadados.tokens_utilizados.toString() },
        tempo_geracao_ms: { N: metadados.tempo_geracao_ms.toString() },
        modelo_utilizado: { S: metadados.modelo_utilizado },
        prompt_hash: { S: metadados.prompt_hash }
      };

      // Adicionar campos opcionais
      if (metadados.escola_id) {
        item['escola_id'] = { N: metadados.escola_id.toString() };
      }
      
      if (metadados.contrato_id) {
        item['contrato_id'] = { N: metadados.contrato_id.toString() };
      }

      if (metadados.metadata) {
        item['metadata'] = { S: JSON.stringify(metadados.metadata) };
      }

      const comando = new PutItemCommand({
        TableName: this.dynamoTableName,
        Item: item
      });

      await this.dynamodb.send(comando);
      console.log(`✅ Metadados registrados no DynamoDB: ${metadados.uuid}`);
      
    } catch (error) {
      console.error('❌ Erro ao registrar no DynamoDB:', error);
      
      if (error instanceof DynamoDBServiceException) {
        throw new Error(`Erro DynamoDB: ${error.message} (${error.name})`);
      }
      
      throw new Error(`Erro no registro: ${error.message}`);
    }
  }

  /**
   * Registra documento no Aurora via API
   */
  private async registrarNoAurora(uuid: string, s3Key: string, request: DocumentoIARequest): Promise<void> {
    try {
      const payload = {
        uuid,
        s3_key: s3Key,
        empresa_id: request.empresa_id,
        contrato_id: request.contrato_id,
        escola_id: request.escola_id,
        usuario_id: request.usuario_id,
        tipo_usuario: request.tipo_usuario,
        tipo_arquivo: request.tipo_arquivo,
        nome_arquivo: `${request.tipo_arquivo}-${uuid}.json`,
        mime_type: 'application/json',
        tamanho: Buffer.byteLength(JSON.stringify(request.prompt)),
        descricao: `Documento gerado por IA: ${request.tipo_arquivo}`,
        metadata: request.metadata || {}
      };

      // Fazer chamada para API local
      const response = await axios.post('http://localhost:5000/api/arquivos', payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Service': 'lambda-ia-service'
        },
        timeout: 10000
      });

      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Documento registrado no Aurora: ${uuid}`);
      } else {
        console.warn(`⚠️ Resposta inesperada do Aurora: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao registrar no Aurora:', error);
      // Não falhar o processo todo por causa do Aurora
      console.log('⚠️ Continuando sem registro no Aurora');
    }
  }

  /**
   * Processa requisição completa de geração de documento IA
   */
  async processarDocumentoIA(request: DocumentoIARequest): Promise<DocumentoIAResponse> {
    console.log(`🚀 Iniciando geração de documento IA para usuário ${request.usuario_id}`);
    
    try {
      // Gerar UUID único para o documento
      const uuid = uuidv4();
      const s3Key = this.gerarS3Key(request, uuid);
      const dataAtual = new Date().toISOString();
      const promptHash = this.gerarHashPrompt(request.prompt);

      // 1. Gerar conteúdo via Bedrock
      console.log('🤖 Gerando conteúdo via AWS Bedrock...');
      const resultadoBedrock = await this.invocarBedrock(request);

      // 2. Preparar documento completo
      const documentoCompleto = {
        uuid,
        metadata: {
          empresa_id: request.empresa_id,
          contrato_id: request.contrato_id,
          escola_id: request.escola_id,
          usuario_id: request.usuario_id,
          tipo_usuario: request.tipo_usuario,
          nome_usuario: request.nome_usuario,
          tipo_arquivo: request.tipo_arquivo,
          data_criacao: dataAtual,
          modelo_utilizado: request.modelo_bedrock || 'anthropic.claude-3-haiku-20240307-v1:0',
          prompt_hash: promptHash,
          tokens_utilizados: resultadoBedrock.tokens_utilizados,
          tempo_geracao_ms: resultadoBedrock.tempo_geracao_ms
        },
        prompt_original: request.prompt,
        conteudo_gerado: resultadoBedrock.conteudo,
        estatisticas: {
          tokens_input: request.prompt.length,
          tokens_output: resultadoBedrock.tokens_utilizados,
          tempo_total_ms: resultadoBedrock.tempo_geracao_ms
        }
      };

      // 3. Upload para S3
      console.log('📤 Enviando documento para S3...');
      await this.uploadParaS3(s3Key, documentoCompleto, {
        usuario_id: request.usuario_id.toString(),
        tipo_arquivo: request.tipo_arquivo,
        data_criacao: dataAtual
      });

      // 4. Registrar no DynamoDB
      console.log('📝 Registrando metadados no DynamoDB...');
      const metadados: MetadadosDynamoDB = {
        empresa_id: request.empresa_id,
        uuid,
        usuario_id: request.usuario_id,
        tipo_usuario: request.tipo_usuario,
        escola_id: request.escola_id,
        contrato_id: request.contrato_id,
        data_criacao: dataAtual,
        tipo_arquivo: request.tipo_arquivo,
        nome_usuario: request.nome_usuario,
        s3_key: s3Key,
        status: 'ativo',
        tokens_utilizados: resultadoBedrock.tokens_utilizados,
        tempo_geracao_ms: resultadoBedrock.tempo_geracao_ms,
        modelo_utilizado: request.modelo_bedrock || 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt_hash: promptHash,
        metadata: request.metadata
      };

      await this.registrarNoDynamoDB(metadados);

      // 5. Registrar no Aurora (opcional)
      console.log('🗄️ Registrando no Aurora...');
      await this.registrarNoAurora(uuid, s3Key, request);

      // 6. Preparar resposta
      const resposta: DocumentoIAResponse = {
        uuid,
        s3_key: s3Key,
        conteudo_gerado: resultadoBedrock.conteudo,
        tokens_utilizados: resultadoBedrock.tokens_utilizados,
        tempo_geracao_ms: resultadoBedrock.tempo_geracao_ms,
        status: 'sucesso',
        data_criacao: dataAtual
      };

      console.log(`✅ Documento IA gerado com sucesso: ${uuid}`);
      return resposta;
      
    } catch (error) {
      console.error('❌ Erro ao processar documento IA:', error);
      throw new Error(`Falha na geração do documento: ${error.message}`);
    }
  }

  /**
   * Busca documento do S3 por UUID
   */
  async buscarDocumentoPorUUID(uuid: string, empresa_id: number): Promise<any> {
    try {
      // Buscar metadados no DynamoDB primeiro
      const comando = new GetItemCommand({
        TableName: this.dynamoTableName,
        Key: {
          empresa_id: { N: empresa_id.toString() },
          uuid: { S: uuid }
        }
      });

      const resultado = await this.dynamodb.send(comando);
      
      if (!resultado.Item) {
        throw new Error('Documento não encontrado');
      }

      const s3Key = resultado.Item.s3_key.S;
      
      // Buscar conteúdo no S3
      const comandoS3 = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      });

      const objetoS3 = await this.s3.send(comandoS3);
      const conteudo = JSON.parse(await objetoS3.Body.transformToString());

      return conteudo;
      
    } catch (error) {
      console.error('❌ Erro ao buscar documento:', error);
      throw new Error(`Erro na busca: ${error.message}`);
    }
  }

  /**
   * Lista documentos de um usuário
   */
  async listarDocumentosUsuario(empresa_id: number, usuario_id: number): Promise<MetadadosDynamoDB[]> {
    try {
      const comando = new QueryCommand({
        TableName: this.dynamoTableName,
        KeyConditionExpression: 'empresa_id = :empresa_id',
        FilterExpression: 'usuario_id = :usuario_id',
        ExpressionAttributeValues: {
          ':empresa_id': { N: empresa_id.toString() },
          ':usuario_id': { N: usuario_id.toString() }
        }
      });

      const resultado = await this.dynamodb.send(comando);
      
      return resultado.Items?.map(item => ({
        empresa_id: parseInt(item.empresa_id.N),
        uuid: item.uuid.S,
        usuario_id: parseInt(item.usuario_id.N),
        tipo_usuario: item.tipo_usuario.S,
        escola_id: item.escola_id?.N ? parseInt(item.escola_id.N) : undefined,
        contrato_id: item.contrato_id?.N ? parseInt(item.contrato_id.N) : undefined,
        data_criacao: item.data_criacao.S,
        tipo_arquivo: item.tipo_arquivo.S,
        nome_usuario: item.nome_usuario.S,
        s3_key: item.s3_key.S,
        status: item.status.S,
        tokens_utilizados: parseInt(item.tokens_utilizados.N),
        tempo_geracao_ms: parseInt(item.tempo_geracao_ms.N),
        modelo_utilizado: item.modelo_utilizado.S,
        prompt_hash: item.prompt_hash.S,
        metadata: item.metadata?.S ? JSON.parse(item.metadata.S) : undefined
      })) || [];
      
    } catch (error) {
      console.error('❌ Erro ao listar documentos:', error);
      throw new Error(`Erro na listagem: ${error.message}`);
    }
  }
}

export default LambdaIAService;