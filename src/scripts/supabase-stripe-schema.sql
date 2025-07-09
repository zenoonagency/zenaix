-- Schema para integração do Stripe com Supabase
-- Tabela de planos disponíveis

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,
  boards_limit INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar o timestamp em plans
CREATE TRIGGER update_plans_timestamp
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de assinaturas dos usuários
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar o timestamp em subscriptions
CREATE TRIGGER update_subscriptions_timestamp
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela para armazenar histórico de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas para plans
CREATE POLICY "Qualquer pessoa pode visualizar planos ativos"
ON plans
FOR SELECT
USING (is_active = true);

CREATE POLICY "Apenas administradores podem modificar planos"
ON plans
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
  )
);

-- Políticas para subscriptions
CREATE POLICY "Usuários podem ver apenas suas próprias assinaturas"
ON subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Apenas stripe webhook e admin podem criar/atualizar assinaturas"
ON subscriptions
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
  ) OR auth.uid() IS NULL
);

CREATE POLICY "Apenas stripe webhook e admin podem atualizar assinaturas"
ON subscriptions
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
  ) OR auth.uid() IS NULL
);

-- Políticas para payments
CREATE POLICY "Usuários podem ver apenas seus próprios pagamentos"
ON payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Apenas stripe webhook e admin podem inserir pagamentos"
ON payments
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
  ) OR auth.uid() IS NULL
);

-- Inserir planos de exemplo
INSERT INTO plans (name, stripe_price_id, stripe_product_id, boards_limit, price, description, features, is_active)
VALUES 
  ('Plano Básico', 'price_placeholder1', 'prod_placeholder1', 1, 30.00, 'Acesso a 1 quadro kanban', '{"features": ["1 quadro", "Listas ilimitadas", "Cartões ilimitados"]}', true),
  ('Plano Pro', 'price_placeholder2', 'prod_placeholder2', 5, 80.00, 'Acesso a 5 quadros kanban', '{"features": ["5 quadros", "Listas ilimitadas", "Cartões ilimitados", "Anexos", "Exportação"]}', true),
  ('Plano Business', 'price_placeholder3', 'prod_placeholder3', 20, 150.00, 'Acesso a 20 quadros kanban', '{"features": ["20 quadros", "Listas ilimitadas", "Cartões ilimitados", "Anexos", "Exportação", "Colaboradores", "Suporte dedicado"]}', true);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id); 