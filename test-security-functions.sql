-- ✅ TESTE COMPLETO: Sistema de Segurança com Views e Funções
-- Validação das implementações de controle de acesso hierárquico

-- 1. Verificar view criada
SELECT 'VIEW vw_alunos_por_professor' as teste, 
       table_name, 
       view_definition 
FROM information_schema.views 
WHERE table_name = 'vw_alunos_por_professor';

-- 2. Verificar funções de segurança
SELECT 'FUNÇÕES DE SEGURANÇA' as teste,
       routine_name,
       routine_type,
       security_type,
       routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE 'get_alunos_por_%'
  AND security_type = 'DEFINER';

-- 3. Testar controle de acesso para professor
SELECT 'TESTE PROFESSOR ID 1' as teste,
       aluno_id,
       nome_aluno,
       turma,
       serie,
       escola_nome
FROM get_alunos_por_professor(1);

-- 4. Testar controle de acesso para escola
SELECT 'TESTE ESCOLA ID 1' as teste,
       aluno_id,
       nome_aluno,
       turma,
       serie,
       escola_nome
FROM get_alunos_por_escola(1);

-- 5. Verificar dados da view diretamente
SELECT 'DADOS VIEW DIRETA' as teste,
       aluno_id,
       nome_aluno,
       turma,
       serie,
       escola_nome,
       empresa_id
FROM vw_alunos_por_professor;

-- 6. Teste de segurança: professor inexistente
SELECT 'TESTE PROFESSOR INEXISTENTE' as teste,
       COUNT(*) as registros_retornados
FROM get_alunos_por_professor(999);

-- 7. Teste de segurança: escola inexistente
SELECT 'TESTE ESCOLA INEXISTENTE' as teste,
       COUNT(*) as registros_retornados
FROM get_alunos_por_escola(999);

-- 8. Validar integridade referencial
SELECT 'INTEGRIDADE REFERENCIAL' as teste,
       a.usr_id as aluno_user_id,
       u.id as usuario_id,
       p.usr_id as professor_user_id,
       e.id as escola_id,
       e.empresa_id
FROM alunos a
JOIN usuarios u ON u.id = a.usr_id
JOIN professores p ON p.escola_id = a.escola_id
JOIN escolas e ON e.id = a.escola_id
WHERE a.status = 'ativo' AND p.status = 'ativo';

-- 9. Resumo final do sistema de segurança
SELECT 'RESUMO SISTEMA SEGURANÇA' as resultado,
       (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'vw_alunos_por_professor') as views_implementadas,
       (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE 'get_alunos_por_%' AND security_type = 'DEFINER') as funcoes_seguras,
       (SELECT COUNT(*) FROM vw_alunos_por_professor) as alunos_visiveis,
       (SELECT COUNT(*) FROM professores WHERE status = 'ativo') as professores_ativos,
       (SELECT COUNT(*) FROM escolas WHERE status = 'ativo') as escolas_ativas;