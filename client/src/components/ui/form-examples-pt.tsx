import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { SelectItem } from '@/components/ui/select';
import {
  FormContainer,
  FormHeader,
  FormSection,
  FormField,
  FormGrid,
  FormActions,
  TemplateInput,
  TemplateSelect,
  TemplateTextarea,
  TemplateDatePicker,
  TemplateCheckbox,
  TemplateButton
} from './form-template';

// Exemplo 1: Formulário de Cadastro de Usuário em Português
export const ExemploCadastroUsuario = () => {
  const [dadosFormulario, setDadosFormulario] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    funcao: '',
    dataNascimento: undefined as Date | undefined,
    endereco: '',
    ehMenor: false,
    nomeResponsavel: '',
    emailResponsavel: ''
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <TemplateButton variant="primary">
          Exemplo: Cadastro de Usuário
        </TemplateButton>
      </DialogTrigger>
      <DialogContent className="p-0">
        <FormContainer>
          <div className="p-8">
            <FormHeader
              title="Cadastro de Usuário"
              description="Preencha os dados para criar uma nova conta na plataforma educacional"
              colorScheme="primary"
            />

            <div className="space-y-6">
              <FormSection title="Dados Pessoais" icon="user" colorScheme="primary">
                <FormGrid columns={2}>
                  <FormField label="Nome" required>
                    <TemplateInput
                      placeholder="Digite o primeiro nome"
                      icon="user"
                      value={dadosFormulario.nome}
                      onChange={(e) => setDadosFormulario({...dadosFormulario, nome: e.target.value})}
                    />
                  </FormField>

                  <FormField label="Sobrenome" required>
                    <TemplateInput
                      placeholder="Digite o sobrenome"
                      value={dadosFormulario.sobrenome}
                      onChange={(e) => setDadosFormulario({...dadosFormulario, sobrenome: e.target.value})}
                    />
                  </FormField>
                </FormGrid>

                <FormField label="Data de Nascimento" required>
                  <TemplateDatePicker
                    placeholder="Selecione a data de nascimento"
                    value={dadosFormulario.dataNascimento}
                    onChange={(date) => setDadosFormulario({...dadosFormulario, dataNascimento: date})}
                  />
                </FormField>

                <FormField label="Usuário é menor de idade?">
                  <TemplateCheckbox
                    label="Marque se o usuário tem menos de 18 anos"
                    checked={dadosFormulario.ehMenor}
                    onChange={(checked) => setDadosFormulario({...dadosFormulario, ehMenor: checked})}
                  />
                </FormField>
              </FormSection>

              <FormSection title="Informações de Contato" icon="email" colorScheme="secondary">
                <FormField label="Email" required>
                  <TemplateInput
                    placeholder="Digite o email principal"
                    icon="email"
                    type="email"
                    value={dadosFormulario.email}
                    onChange={(e) => setDadosFormulario({...dadosFormulario, email: e.target.value})}
                    colorScheme="secondary"
                  />
                </FormField>

                <FormGrid columns={2}>
                  <FormField label="Telefone">
                    <TemplateInput
                      placeholder="(11) 99999-9999"
                      icon="phone"
                      value={dadosFormulario.telefone}
                      onChange={(e) => setDadosFormulario({...dadosFormulario, telefone: e.target.value})}
                      colorScheme="secondary"
                    />
                  </FormField>

                  <FormField label="Função" required>
                    <TemplateSelect
                      placeholder="Selecione a função"
                      icon="role"
                      value={dadosFormulario.funcao}
                      onValueChange={(value) => setDadosFormulario({...dadosFormulario, funcao: value})}
                      colorScheme="secondary"
                    >
                      <SelectItem value="student">Aluno</SelectItem>
                      <SelectItem value="teacher">Professor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </TemplateSelect>
                  </FormField>
                </FormGrid>

                <FormField label="Endereço">
                  <TemplateTextarea
                    placeholder="Digite o endereço completo (opcional)"
                    value={dadosFormulario.endereco}
                    onChange={(e) => setDadosFormulario({...dadosFormulario, endereco: e.target.value})}
                    colorScheme="secondary"
                  />
                </FormField>
              </FormSection>

              {dadosFormulario.ehMenor && (
                <FormSection title="Dados do Responsável" icon="user" colorScheme="warning">
                  <FormGrid columns={2}>
                    <FormField label="Nome do Responsável" required>
                      <TemplateInput
                        placeholder="Nome completo do responsável"
                        icon="user"
                        value={dadosFormulario.nomeResponsavel}
                        onChange={(e) => setDadosFormulario({...dadosFormulario, nomeResponsavel: e.target.value})}
                        colorScheme="warning"
                      />
                    </FormField>

                    <FormField label="Email do Responsável" required>
                      <TemplateInput
                        placeholder="Email do responsável"
                        icon="email"
                        type="email"
                        value={dadosFormulario.emailResponsavel}
                        onChange={(e) => setDadosFormulario({...dadosFormulario, emailResponsavel: e.target.value})}
                        colorScheme="warning"
                      />
                    </FormField>
                  </FormGrid>
                </FormSection>
              )}

              <FormActions align="between">
                <TemplateButton variant="outline">
                  Cancelar
                </TemplateButton>
                <TemplateButton variant="primary" type="submit">
                  Cadastrar Usuário
                </TemplateButton>
              </FormActions>
            </div>
          </div>
        </FormContainer>
      </DialogContent>
    </Dialog>
  );
};

// Exemplo 2: Formulário de Criação de Curso
export const ExemploCriacaoCurso = () => {
  const [dadosCurso, setDadosCurso] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    nivel: '',
    duracao: '',
    maxAlunos: '',
    dataInicio: undefined as Date | undefined,
    ehPublico: true,
    preRequisitos: ''
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <TemplateButton variant="success">
          Exemplo: Criação de Curso
        </TemplateButton>
      </DialogTrigger>
      <DialogContent className="p-0">
        <FormContainer>
          <div className="p-8">
            <FormHeader
              title="Criar Novo Curso"
              description="Configure os detalhes do curso que será oferecido na plataforma"
              colorScheme="success"
            />

            <div className="space-y-6">
              <FormSection title="Informações Básicas" icon="education" colorScheme="success">
                <FormField label="Título do Curso" required>
                  <TemplateInput
                    placeholder="Digite o nome do curso"
                    icon="education"
                    value={dadosCurso.titulo}
                    onChange={(e) => setDadosCurso({...dadosCurso, titulo: e.target.value})}
                    colorScheme="success"
                  />
                </FormField>

                <FormField label="Descrição do Curso" required>
                  <TemplateTextarea
                    placeholder="Descreva os objetivos e conteúdo do curso"
                    value={dadosCurso.descricao}
                    onChange={(e) => setDadosCurso({...dadosCurso, descricao: e.target.value})}
                    rows={4}
                    colorScheme="success"
                  />
                </FormField>

                <FormGrid columns={3}>
                  <FormField label="Categoria">
                    <TemplateSelect
                      placeholder="Selecione"
                      value={dadosCurso.categoria}
                      onValueChange={(value) => setDadosCurso({...dadosCurso, categoria: value})}
                      colorScheme="success"
                    >
                      <SelectItem value="matematica">Matemática</SelectItem>
                      <SelectItem value="portugues">Português</SelectItem>
                      <SelectItem value="ciencias">Ciências</SelectItem>
                      <SelectItem value="historia">História</SelectItem>
                    </TemplateSelect>
                  </FormField>

                  <FormField label="Nível">
                    <TemplateSelect
                      placeholder="Selecione"
                      value={dadosCurso.nivel}
                      onValueChange={(value) => setDadosCurso({...dadosCurso, nivel: value})}
                      colorScheme="success"
                    >
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </TemplateSelect>
                  </FormField>

                  <FormField label="Duração (horas)">
                    <TemplateInput
                      placeholder="Ex: 40"
                      type="number"
                      value={dadosCurso.duracao}
                      onChange={(e) => setDadosCurso({...dadosCurso, duracao: e.target.value})}
                      colorScheme="success"
                    />
                  </FormField>
                </FormGrid>
              </FormSection>

              <FormSection title="Configurações do Curso" icon="academic" colorScheme="secondary">
                <FormGrid columns={2}>
                  <FormField label="Data de Início">
                    <TemplateDatePicker
                      placeholder="Selecione a data de início"
                      value={dadosCurso.dataInicio}
                      onChange={(date) => setDadosCurso({...dadosCurso, dataInicio: date})}
                      colorScheme="secondary"
                    />
                  </FormField>

                  <FormField label="Máximo de Alunos">
                    <TemplateInput
                      placeholder="Ex: 30"
                      type="number"
                      value={dadosCurso.maxAlunos}
                      onChange={(e) => setDadosCurso({...dadosCurso, maxAlunos: e.target.value})}
                      colorScheme="secondary"
                    />
                  </FormField>
                </FormGrid>

                <FormField label="Pré-requisitos">
                  <TemplateTextarea
                    placeholder="Liste os conhecimentos necessários para participar do curso"
                    value={dadosCurso.preRequisitos}
                    onChange={(e) => setDadosCurso({...dadosCurso, preRequisitos: e.target.value})}
                    rows={3}
                    colorScheme="secondary"
                  />
                </FormField>

                <FormField label="Visibilidade do Curso">
                  <TemplateCheckbox
                    label="Curso público (visível para todos os usuários)"
                    checked={dadosCurso.ehPublico}
                    onChange={(checked) => setDadosCurso({...dadosCurso, ehPublico: checked})}
                    colorScheme="secondary"
                  />
                </FormField>
              </FormSection>

              <FormActions align="between">
                <TemplateButton variant="outline">
                  Salvar como Rascunho
                </TemplateButton>
                <TemplateButton variant="success" type="submit">
                  Criar Curso
                </TemplateButton>
              </FormActions>
            </div>
          </div>
        </FormContainer>
      </DialogContent>
    </Dialog>
  );
};

// Exemplo 3: Formulário de Notificação
export const ExemploNotificacao = () => {
  const [dadosNotificacao, setDadosNotificacao] = useState({
    tipo: '',
    prioridade: '',
    nomeAluno: '',
    assunto: '',
    mensagem: '',
    contatoResponsavel: '',
    requerResposta: false,
    prazoResposta: undefined as Date | undefined
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <TemplateButton variant="warning">
          Exemplo: Notificação
        </TemplateButton>
      </DialogTrigger>
      <DialogContent className="p-0">
        <FormContainer>
          <div className="p-8">
            <FormHeader
              title="Nova Notificação"
              description="Crie uma notificação para comunicação com pais e responsáveis"
              colorScheme="warning"
            />

            <div className="space-y-6">
              <FormSection title="Tipo de Notificação" icon="user" colorScheme="warning">
                <FormGrid columns={2}>
                  <FormField label="Categoria" required>
                    <TemplateSelect
                      placeholder="Selecione o tipo"
                      value={dadosNotificacao.tipo}
                      onValueChange={(value) => setDadosNotificacao({...dadosNotificacao, tipo: value})}
                      colorScheme="warning"
                    >
                      <SelectItem value="comportamento">Comportamento</SelectItem>
                      <SelectItem value="academico">Acadêmico</SelectItem>
                      <SelectItem value="administrativo">Administrativo</SelectItem>
                      <SelectItem value="comunicado">Comunicado</SelectItem>
                    </TemplateSelect>
                  </FormField>

                  <FormField label="Prioridade" required>
                    <TemplateSelect
                      placeholder="Selecione a prioridade"
                      value={dadosNotificacao.prioridade}
                      onValueChange={(value) => setDadosNotificacao({...dadosNotificacao, prioridade: value})}
                      colorScheme="warning"
                    >
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </TemplateSelect>
                  </FormField>
                </FormGrid>
              </FormSection>

              <FormSection title="Detalhes da Notificação" icon="email" colorScheme="danger">
                <FormField label="Nome do Aluno" required>
                  <TemplateInput
                    placeholder="Digite o nome do aluno"
                    icon="user"
                    value={dadosNotificacao.nomeAluno}
                    onChange={(e) => setDadosNotificacao({...dadosNotificacao, nomeAluno: e.target.value})}
                    colorScheme="danger"
                  />
                </FormField>

                <FormField label="Assunto" required>
                  <TemplateInput
                    placeholder="Título resumido da notificação"
                    value={dadosNotificacao.assunto}
                    onChange={(e) => setDadosNotificacao({...dadosNotificacao, assunto: e.target.value})}
                    colorScheme="danger"
                  />
                </FormField>

                <FormField label="Mensagem" required>
                  <TemplateTextarea
                    placeholder="Descreva detalhadamente a situação ou comunicado"
                    value={dadosNotificacao.mensagem}
                    onChange={(e) => setDadosNotificacao({...dadosNotificacao, mensagem: e.target.value})}
                    rows={5}
                    colorScheme="danger"
                  />
                </FormField>

                <FormGrid columns={2}>
                  <FormField label="Contato do Responsável">
                    <TemplateInput
                      placeholder="Email ou telefone"
                      icon="phone"
                      value={dadosNotificacao.contatoResponsavel}
                      onChange={(e) => setDadosNotificacao({...dadosNotificacao, contatoResponsavel: e.target.value})}
                      colorScheme="danger"
                    />
                  </FormField>

                  <FormField label="Prazo para Resposta">
                    <TemplateDatePicker
                      placeholder="Data limite (opcional)"
                      value={dadosNotificacao.prazoResposta}
                      onChange={(date) => setDadosNotificacao({...dadosNotificacao, prazoResposta: date})}
                      colorScheme="danger"
                    />
                  </FormField>
                </FormGrid>

                <FormField label="Configurações">
                  <TemplateCheckbox
                    label="Esta notificação requer resposta dos responsáveis"
                    checked={dadosNotificacao.requerResposta}
                    onChange={(checked) => setDadosNotificacao({...dadosNotificacao, requerResposta: checked})}
                    colorScheme="danger"
                  />
                </FormField>
              </FormSection>

              <FormActions align="between">
                <TemplateButton variant="outline">
                  Cancelar
                </TemplateButton>
                <TemplateButton variant="warning" type="submit">
                  Enviar Notificação
                </TemplateButton>
              </FormActions>
            </div>
          </div>
        </FormContainer>
      </DialogContent>
    </Dialog>
  );
};

// Componente para mostrar todos os exemplos
export const ExemplosFormularios = () => {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Exemplos de Formulários com Template IAverse
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ExemploCadastroUsuario />
        <ExemploCriacaoCurso />
        <ExemploNotificacao />
      </div>
      
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <h3 className="text-lg font-bold text-slate-800 mb-3">
          💡 Como Usar o Template
        </h3>
        <ul className="text-slate-700 space-y-2">
          <li>• <strong>Consistência Visual:</strong> Todos os formulários seguem o mesmo padrão de cores e tipografia</li>
          <li>• <strong>Responsividade:</strong> Layouts adaptáveis para desktop, tablet e mobile</li>
          <li>• <strong>Acessibilidade:</strong> Componentes com foco em usabilidade e navegação por teclado</li>
          <li>• <strong>Validação:</strong> Integração nativa com validação de formulários</li>
          <li>• <strong>Customização:</strong> Esquemas de cores configuráveis por tipo de formulário</li>
        </ul>
      </div>
    </div>
  );
};