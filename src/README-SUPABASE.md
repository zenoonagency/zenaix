# Configuração do Supabase para Integração

Este documento fornece instruções passo a passo para configurar o Supabase como backend do sistema.

## Credenciais do Projeto

- **URL do Supabase**: `https://tcprlbkecswamogqaqfx.supabase.co`
- **Chave anônima**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcHJsYmtlY3N3YW1vZ3FhcWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDkyMjUsImV4cCI6MjA2MjIyNTIyNX0.wuJDaAX6IDtElgfx7Ntoyh772t6_P-TQOH2rrlymvEg`

## Passos para Configuração

### 1. Configuração Inicial

1. Acesse o [painel do Supabase](https://app.supabase.io)
2. Faça login na conta associada ao projeto
3. Selecione o projeto ou crie um novo se necessário

### 2. Configuração do Banco de Dados

1. No painel do Supabase, vá para **SQL Editor**.
2. Crie uma nova query e cole o script SQL completo do arquivo `src/scripts/supabase-schema.sql`.
3. Execute o script para criar todas as tabelas, funções, gatilhos e políticas.

### 3. Configuração da Autenticação

1. Vá para **Authentication > Settings**
2. Configure as opções de acordo com suas necessidades:
   - **Site URL**: URL do seu site de produção
   - **Redirect URLs**: URLs para onde os usuários serão redirecionados após a autenticação

3. Em **Authentication > Providers**:
   - Habilite Email/Password 
   - Opcionalmente, configure provedores OAuth como Google, GitHub, etc.

### 4. Configuração das Políticas de Segurança

O script SQL já inclui as políticas básicas de segurança (RLS), mas você pode revisar e ajustar:

1. No painel, vá para **Authentication > Policies**
2. Verifique se todas as tabelas têm as políticas adequadas:
   - `profiles`: Políticas para visualização e atualização
   - `boards`: Políticas para CRUD apenas para o proprietário
   - `lists`: Políticas para CRUD baseadas na propriedade do quadro
   - `cards`: Políticas para CRUD baseadas na propriedade da lista/quadro

### 5. Configuração do Storage (se necessário)

Se desejar armazenar arquivos (por exemplo, anexos em cartões ou imagens):

1. Vá para **Storage**
2. Crie um novo bucket (ex: `attachments`)
3. Configure políticas de segurança para o bucket

## Verificação da Configuração

Após concluir os passos acima, você pode verificar se tudo está funcionando corretamente:

1. No **Table Editor**, verifique se todas as tabelas foram criadas corretamente.
2. Em **Authentication > Policies**, verifique se as políticas estão aplicadas.
3. Em **Authentication > Users**, você pode criar um usuário de teste.

## Integração com o Frontend

O código neste projeto já está configurado para usar o Supabase como backend. Os arquivos principais são:

- `src/services/supabaseClient.ts`: Cliente Supabase
- `src/services/authService.ts`: Gerenciamento de autenticação
- `src/services/kanbanService.ts`: Operações de CRUD para o kanban

## Integrações Futuras

Para a integração com o Stripe, será necessário:

1. Criar tabelas adicionais para gerenciar planos e assinaturas
2. Configurar Edge Functions no Supabase para comunicação segura com o Stripe
3. Implementar webhooks para gerenciar eventos do Stripe

## Solução de Problemas

Se encontrar algum problema durante a configuração:

1. Verifique os logs no painel do Supabase em **Database > Logs**
2. Confirme se as credenciais estão configuradas corretamente no frontend
3. Verifique as permissões RLS se estiver tendo problemas de acesso aos dados

## Recursos Adicionais

- [Documentação oficial do Supabase](https://supabase.io/docs)
- [Exemplos de Row Level Security](https://supabase.io/docs/guides/auth/row-level-security)
- [Guia de autenticação](https://supabase.io/docs/guides/auth) 