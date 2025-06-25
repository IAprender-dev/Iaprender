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

// Example 1: User Registration Form
export const UserRegistrationExample = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    dateOfBirth: undefined as Date | undefined,
    address: '',
    isMinor: false,
    parentName: '',
    parentEmail: ''
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
              description="Preencha os dados para criar uma nova conta na plataforma"
              colorScheme="primary"
            />

            <div className="space-y-6">
              <FormSection title="Dados Pessoais" icon="user" colorScheme="primary">
                <FormGrid columns={2}>
                  <FormField label="Nome" required>
                    <TemplateInput
                      placeholder="Digite o primeiro nome"
                      icon="user"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </FormField>

                  <FormField label="Sobrenome" required>
                    <TemplateInput
                      placeholder="Digite o sobrenome"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </FormField>
                </FormGrid>

                <FormField label="Data de Nascimento" required>
                  <TemplateDatePicker
                    placeholder="Selecione a data de nascimento"
                    value={formData.dateOfBirth}
                    onChange={(date) => setFormData({...formData, dateOfBirth: date})}
                  />
                </FormField>

                <FormField label="Usuário é menor de idade?">
                  <TemplateCheckbox
                    label="Marque se o usuário tem menos de 18 anos"
                    checked={formData.isMinor}
                    onChange={(checked) => setFormData({...formData, isMinor: checked})}
                  />
                </FormField>
              </FormSection>

              <FormSection title="Informações de Contato" icon="email" colorScheme="secondary">
                <FormField label="Email" required>
                  <TemplateInput
                    placeholder="Digite o email principal"
                    icon="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    colorScheme="secondary"
                  />
                </FormField>

                <FormGrid columns={2}>
                  <FormField label="Telefone">
                    <TemplateInput
                      placeholder="(11) 99999-9999"
                      icon="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      colorScheme="secondary"
                    />
                  </FormField>

                  <FormField label="Função" required>
                    <TemplateSelect
                      placeholder="Selecione a função"
                      icon="role"
                      value={formData.role}
                      onValueChange={(value) => setFormData({...formData, role: value})}
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
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    colorScheme="secondary"
                  />
                </FormField>
              </FormSection>

              {formData.isMinor && (
                <FormSection title="Dados do Responsável" icon="user" colorScheme="warning">
                  <FormGrid columns={2}>
                    <FormField label="Nome do Responsável" required>
                      <TemplateInput
                        placeholder="Nome completo do responsável"
                        icon="user"
                        value={formData.parentName}
                        onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                        colorScheme="warning"
                      />
                    </FormField>

                    <FormField label="Email do Responsável" required>
                      <TemplateInput
                        placeholder="Email do responsável"
                        icon="email"
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
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

// Example 2: Course Creation Form
export const CourseCreationExample = () => {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    duration: '',
    maxStudents: '',
    startDate: undefined as Date | undefined,
    isPublic: true,
    prerequisites: ''
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
                    value={courseData.title}
                    onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                    colorScheme="success"
                  />
                </FormField>

                <FormField label="Descrição do Curso" required>
                  <TemplateTextarea
                    placeholder="Descreva os objetivos e conteúdo do curso"
                    value={courseData.description}
                    onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                    rows={4}
                    colorScheme="success"
                  />
                </FormField>

                <FormGrid columns={3}>
                  <FormField label="Categoria">
                    <TemplateSelect
                      placeholder="Selecione"
                      value={courseData.category}
                      onValueChange={(value) => setCourseData({...courseData, category: value})}
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
                      value={courseData.level}
                      onValueChange={(value) => setCourseData({...courseData, level: value})}
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
                      value={courseData.duration}
                      onChange={(e) => setCourseData({...courseData, duration: e.target.value})}
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
                      value={courseData.startDate}
                      onChange={(date) => setCourseData({...courseData, startDate: date})}
                      colorScheme="secondary"
                    />
                  </FormField>

                  <FormField label="Máximo de Alunos">
                    <TemplateInput
                      placeholder="Ex: 30"
                      type="number"
                      value={courseData.maxStudents}
                      onChange={(e) => setCourseData({...courseData, maxStudents: e.target.value})}
                      colorScheme="secondary"
                    />
                  </FormField>
                </FormGrid>

                <FormField label="Pré-requisitos">
                  <TemplateTextarea
                    placeholder="Liste os conhecimentos necessários para participar do curso"
                    value={courseData.prerequisites}
                    onChange={(e) => setCourseData({...courseData, prerequisites: e.target.value})}
                    rows={3}
                    colorScheme="secondary"
                  />
                </FormField>

                <FormField label="Visibilidade do Curso">
                  <TemplateCheckbox
                    label="Curso público (visível para todos os usuários)"
                    checked={courseData.isPublic}
                    onChange={(checked) => setCourseData({...courseData, isPublic: checked})}
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

// Example 3: Notification Form
export const NotificationExample = () => {
  const [notificationData, setNotificationData] = useState({
    type: '',
    priority: '',
    studentName: '',
    subject: '',
    message: '',
    parentContact: '',
    requiresResponse: false,
    dueDate: undefined as Date | undefined
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
                      value={notificationData.type}
                      onValueChange={(value) => setNotificationData({...notificationData, type: value})}
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
                      value={notificationData.priority}
                      onValueChange={(value) => setNotificationData({...notificationData, priority: value})}
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
                    value={notificationData.studentName}
                    onChange={(e) => setNotificationData({...notificationData, studentName: e.target.value})}
                    colorScheme="danger"
                  />
                </FormField>

                <FormField label="Assunto" required>
                  <TemplateInput
                    placeholder="Título resumido da notificação"
                    value={notificationData.subject}
                    onChange={(e) => setNotificationData({...notificationData, subject: e.target.value})}
                    colorScheme="danger"
                  />
                </FormField>

                <FormField label="Mensagem" required>
                  <TemplateTextarea
                    placeholder="Descreva detalhadamente a situação ou comunicado"
                    value={notificationData.message}
                    onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                    rows={5}
                    colorScheme="danger"
                  />
                </FormField>

                <FormGrid columns={2}>
                  <FormField label="Contato do Responsável">
                    <TemplateInput
                      placeholder="Email ou telefone"
                      icon="phone"
                      value={notificationData.parentContact}
                      onChange={(e) => setNotificationData({...notificationData, parentContact: e.target.value})}
                      colorScheme="danger"
                    />
                  </FormField>

                  <FormField label="Prazo para Resposta">
                    <TemplateDatePicker
                      placeholder="Data limite (opcional)"
                      value={notificationData.dueDate}
                      onChange={(date) => setNotificationData({...notificationData, dueDate: date})}
                      colorScheme="danger"
                    />
                  </FormField>
                </FormGrid>

                <FormField label="Configurações">
                  <TemplateCheckbox
                    label="Esta notificação requer resposta dos responsáveis"
                    checked={notificationData.requiresResponse}
                    onChange={(checked) => setNotificationData({...notificationData, requiresResponse: checked})}
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

// Component to showcase all examples
export const FormExamplesShowcase = () => {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Exemplos de Formulários com Template
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UserRegistrationExample />
        <CourseCreationExample />
        <NotificationExample />
      </div>
    </div>
  );
};