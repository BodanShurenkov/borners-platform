-- =============================================================================
-- BORNERS GROUP — STRATEGY & PRODUCT DEVELOPMENT PLATFORM
-- Migration: 0001_initial_schema.sql
-- Description: Полная схема базы данных PostgreSQL / Supabase согласно п. 17 ТЗ
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ТИПЫ И ПЕРЕЧИСЛЕНИЯ (ENUMS)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('Owner', 'Admin', 'Manager', 'Viewer', 'Partner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('draft', 'in_review', 'approved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE concept_stage AS ENUM (
    'IDEA',
    'RESEARCH',
    'DESIGN',
    'PROTOTYPE',
    'TESTING',
    'APPROVED',
    'PRODUCTION',
    'READY TO LAUNCH',
    'ON HOLD',
    'REJECTED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM (
    'in_development',
    'sampled',
    'approved',
    'in_production',
    'active',
    'out_of_stock',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE launch_stage_code AS ENUM (
    'concept',
    'design',
    'sample',
    'testing',
    'production',
    'logistics',
    'cards',
    'marketing',
    'sales',
    'analysis'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('To Do', 'In Progress', 'Review', 'Done', 'Blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE financial_scenario AS ENUM ('Conservative', 'Base', 'Optimistic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE experiment_status AS ENUM ('Planned', 'Running', 'Completed', 'Successful', 'Unsuccessful');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- 2. ТРИГГЕР ОБНОВЛЕНИЯ updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. ORGANIZATIONS & USERS (УРОВЕНЬ ОРГАНИЗАЦИИ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  default_currency TEXT NOT NULL DEFAULT 'RUB',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- связь с auth.users Supabase
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  job_title TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'Viewer',
  can_view_finance BOOLEAN NOT NULL DEFAULT false,
  can_view_cost_price BOOLEAN NOT NULL DEFAULT false,
  assigned_brand_ids UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- -----------------------------------------------------------------------------
-- 4. BRANDS (РАСШИРЯЕМЫЙ ПОРТФЕЛЬ БРЕНДОВ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- 'BORNERS', 'NA_TELE' и новые бренды
  name TEXT NOT NULL, -- 'BORNERS', 'НА ТЕЛЕ'
  tagline TEXT NOT NULL DEFAULT '',
  segment TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  accent_color TEXT NOT NULL DEFAULT '#D97745',
  secondary_color TEXT NOT NULL DEFAULT '#111111',
  hero_image_url TEXT,
  target_margin_pct NUMERIC(6,2) NOT NULL DEFAULT 45.00,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_brands_org_id ON public.brands(organization_id);

-- -----------------------------------------------------------------------------
-- 5. STRATEGIES (14 БЛОКОВ СТРАТЕГИИ БРЕНДА + ВЕРСИОННОСТЬ И СОГЛАСОВАНИЕ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL, -- brand_vision, brand_mission, target_audience, ... (14 обязательных блоков)
  section_title TEXT NOT NULL,
  section_order INT NOT NULL DEFAULT 1,
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  draft_content TEXT,
  metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  status approval_status NOT NULL DEFAULT 'approved',
  version INT NOT NULL DEFAULT 1,
  history JSONB NOT NULL DEFAULT '[]'::jsonb, -- массив версий {version, author, updated_at, status, comment}
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_strategies_brand_id ON public.strategies(brand_id);

-- -----------------------------------------------------------------------------
-- 6. PRODUCT_CONCEPTS (PRODUCT LAB — РАЗРАБОТКА НОВЫХ КОНЦЕПЦИЙ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  collection_name TEXT NOT NULL DEFAULT '',
  stage concept_stage NOT NULL DEFAULT 'IDEA',
  idea_description TEXT NOT NULL DEFAULT '',
  customer_problem TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  key_differentiators TEXT NOT NULL DEFAULT '',
  references_notes TEXT NOT NULL DEFAULT '',
  color_combinations TEXT[] NOT NULL DEFAULT '{}',
  materials_spec TEXT NOT NULL DEFAULT '',
  construction_notes TEXT NOT NULL DEFAULT '',
  planned_retail_price NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  planned_unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'RUB',
  target_launch_date DATE,
  supplier_name TEXT NOT NULL DEFAULT '',
  sample_status TEXT NOT NULL DEFAULT 'Не заказан',
  test_results TEXT NOT NULL DEFAULT '',
  development_budget NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  selected_design_version INT NOT NULL DEFAULT 1,
  design_versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  tech_pack JSONB NOT NULL DEFAULT '{}'::jsonb, -- ТЗ для фабрики (ZH / EN / RU)
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  linked_product_id UUID, -- заполняется при создании Product из концепции
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_concepts_brand_id ON public.product_concepts(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_concepts_stage ON public.product_concepts(stage);
CREATE INDEX IF NOT EXISTS idx_product_concepts_owner_id ON public.product_concepts(owner_id);

-- -----------------------------------------------------------------------------
-- 7. PRODUCTS, VARIANTS, PRODUCT_ASSETS, PRODUCT_ECONOMICS (КАТАЛОГ МОДЕЛЕЙ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.product_concepts(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Боксеры',
  product_type TEXT NOT NULL DEFAULT 'Базовая коллекция',
  collection TEXT NOT NULL DEFAULT '',
  price_segment TEXT NOT NULL DEFAULT 'Middle',
  status product_status NOT NULL DEFAULT 'active',
  description TEXT NOT NULL DEFAULT '',
  -- Дизайн
  color_combinations TEXT[] NOT NULL DEFAULT '{}',
  materials TEXT NOT NULL DEFAULT '',
  fabric_composition TEXT NOT NULL DEFAULT '',
  fabric_density_gsm INT NOT NULL DEFAULT 180,
  waistband_type TEXT NOT NULL DEFAULT '',
  fit_type TEXT NOT NULL DEFAULT '',
  construction_details TEXT NOT NULL DEFAULT '',
  size_range TEXT[] NOT NULL DEFAULT ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  -- Производство
  supplier_name TEXT NOT NULL DEFAULT '',
  supplier_country TEXT NOT NULL DEFAULT 'Китай',
  moq INT NOT NULL DEFAULT 1000,
  production_lead_days INT NOT NULL DEFAULT 35,
  delivery_lead_days INT NOT NULL DEFAULT 18,
  -- Продажи (агрегированные или текущие за период)
  units_sold INT NOT NULL DEFAULT 0,
  revenue_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  operating_profit_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  sales_channels TEXT[] NOT NULL DEFAULT '{}',
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_concept_id ON public.products(concept_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_sku TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL DEFAULT '#171717',
  secondary_color_hex TEXT,
  size TEXT NOT NULL,
  pack_configuration TEXT NOT NULL DEFAULT '1 шт.',
  barcode TEXT,
  stock_qty INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

CREATE TABLE IF NOT EXISTS public.product_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.product_concepts(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL DEFAULT 'photo', -- photo, render, tech_pack, certificate
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/svg+xml',
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_assets_product_id ON public.product_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_product_assets_concept_id ON public.product_assets(concept_id);

CREATE TABLE IF NOT EXISTS public.product_economics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'RUB',
  planned_retail_price NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  actual_retail_price NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  discount_pct NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  vat_pct NUMERIC(6,2) NOT NULL DEFAULT 20.00,
  return_rate_pct NUMERIC(6,2) NOT NULL DEFAULT 5.00,
  unit_cost_price NUMERIC(14,2) NOT NULL DEFAULT 0.00, -- Закупочная / себестоимость (ограниченный доступ)
  marketplace_commission_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  logistics_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  advertising_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  other_variable_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Серверная функция расчёта юнит-экономики согласно формуле п. 11 ТЗ:
-- Прибыль на единицу = чистая выручка на единицу − себестоимость − комиссии − логистика − реклама − прочие переменные расходы
CREATE OR REPLACE FUNCTION public.calculate_unit_economics(
  p_retail_price NUMERIC(14,2),
  p_discount_pct NUMERIC(6,2),
  p_vat_pct NUMERIC(6,2),
  p_unit_cost NUMERIC(14,2),
  p_commission NUMERIC(14,2),
  p_logistics NUMERIC(14,2),
  p_advertising NUMERIC(14,2),
  p_other_variable NUMERIC(14,2)
)
RETURNS TABLE (
  price_after_discount NUMERIC(14,2),
  net_revenue_per_unit NUMERIC(14,2),
  unit_profit NUMERIC(14,2),
  margin_pct NUMERIC(6,2)
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_price_after_discount NUMERIC(14,2);
  v_net_revenue NUMERIC(14,2);
  v_unit_profit NUMERIC(14,2);
  v_margin NUMERIC(6,2);
BEGIN
  v_price_after_discount := ROUND(p_retail_price * (1 - COALESCE(p_discount_pct, 0) / 100.0), 2);
  v_net_revenue := ROUND(v_price_after_discount / (1 + COALESCE(p_vat_pct, 0) / 100.0), 2);
  v_unit_profit := ROUND(
    v_net_revenue
    - COALESCE(p_unit_cost, 0)
    - COALESCE(p_commission, 0)
    - COALESCE(p_logistics, 0)
    - COALESCE(p_advertising, 0)
    - COALESCE(p_other_variable, 0),
    2
  );
  IF v_net_revenue > 0 THEN
    v_margin := ROUND((v_unit_profit / v_net_revenue) * 100.0, 2);
  ELSE
    v_margin := 0.00;
  END IF;

  RETURN QUERY SELECT v_price_after_discount, v_net_revenue, v_unit_profit, v_margin;
END;
$$;

-- -----------------------------------------------------------------------------
-- 8. LAUNCHES & LAUNCH_STAGES (КАЛЕНДАРЬ И УПРАВЛЕНИЕ ЗАПУСКАМИ, П. 10 ТЗ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  concept_id UUID REFERENCES public.product_concepts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  collection_name TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  readiness_pct INT NOT NULL DEFAULT 0 CHECK (readiness_pct BETWEEN 0 AND 100),
  production_status TEXT NOT NULL DEFAULT 'По графику',
  marketing_budget_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  sales_plan_units INT NOT NULL DEFAULT 0,
  sales_plan_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Подготовка', -- Подготовка, В работе, Готов к старту, Запущен, Завершён, На паузе
  hero_image_url TEXT,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb, -- 10 этапов: концепция -> дизайн -> образец -> тест -> производство -> логистика -> карточки -> маркетинг -> продажи -> анализ
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_launches_brand_id ON public.launches(brand_id);
CREATE INDEX IF NOT EXISTS idx_launches_product_id ON public.launches(product_id);
CREATE INDEX IF NOT EXISTS idx_launches_start_date ON public.launches(start_date);

-- -----------------------------------------------------------------------------
-- 9. CAMPAIGNS & GROWTH_EXPERIMENTS (MARKETING & GROWTH, П. 9 ТЗ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  launch_id UUID REFERENCES public.launches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL, -- Wildberries, Ozon, Яндекс Маркет, Собственный магазин, Instagram/Reels, Telegram, Блогеры, Прочие
  goal TEXT NOT NULL DEFAULT '',
  period_label TEXT NOT NULL DEFAULT '',
  planned_budget_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  actual_budget_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Активна',
  product_ids UUID[] NOT NULL DEFAULT '{}',
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb, -- применимые метрики канала (показы, CTR, CPC, заказы, выкупы, выручка, ДРР, ROAS, CAC)
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON public.campaigns(brand_id);

CREATE TABLE IF NOT EXISTS public.growth_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  hypothesis TEXT NOT NULL,
  rationale TEXT NOT NULL DEFAULT '',
  budget_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  method TEXT NOT NULL DEFAULT '',
  success_criteria TEXT NOT NULL DEFAULT '',
  timeframe TEXT NOT NULL DEFAULT '',
  result_summary TEXT NOT NULL DEFAULT '',
  decision TEXT NOT NULL DEFAULT '',
  status experiment_status NOT NULL DEFAULT 'Planned',
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_experiments_brand_id ON public.growth_experiments(brand_id);

-- -----------------------------------------------------------------------------
-- 10. FINANCIAL_PLANS (ФИНАНСЫ, ПЛАН/ФАКТ И СЦЕНАРИИ, П. 11 ТЗ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  scenario financial_scenario NOT NULL DEFAULT 'Base',
  period_month TEXT NOT NULL, -- '2027-01', '2027-02', ...
  currency TEXT NOT NULL DEFAULT 'RUB',
  planned_buyout_units INT NOT NULL DEFAULT 0,
  actual_buyout_units INT, -- NULL означает «Нет данных» (не путать с 0, п. 4 ТЗ!)
  avg_selling_price_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  planned_revenue_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  actual_revenue_rub NUMERIC(14,2), -- NULL = «Нет данных»
  planned_operating_profit_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  actual_operating_profit_rub NUMERIC(14,2), -- NULL = «Нет данных»
  fixed_costs_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  marketing_budget_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  launch_investment_rub NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  source_label TEXT NOT NULL DEFAULT 'Финансовая модель v1.0',
  change_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, scenario, period_month)
);

CREATE INDEX IF NOT EXISTS idx_financial_plans_brand_scenario ON public.financial_plans(brand_id, scenario);

-- -----------------------------------------------------------------------------
-- 11. STRATEGIC_GOALS, PROJECTS, TASKS (ROADMAP & TASKS, П. 12 ТЗ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strategic_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE, -- NULL = цель всей группы
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  period_year INT NOT NULL DEFAULT 2027,
  period_quarter TEXT NOT NULL DEFAULT 'Q1 2027',
  target_metric TEXT NOT NULL DEFAULT '',
  current_progress_pct INT NOT NULL DEFAULT 0 CHECK (current_progress_pct BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'On Track',
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategic_goals_brand_id ON public.strategic_goals(brand_id);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  strategic_goal_id UUID REFERENCES public.strategic_goals(id) ON DELETE SET NULL,
  concept_id UUID REFERENCES public.product_concepts(id) ON DELETE SET NULL,
  launch_id UUID REFERENCES public.launches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  timeline_quarter TEXT NOT NULL DEFAULT 'Q1 2027',
  timeline_month TEXT NOT NULL DEFAULT '2027-02',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'В работе',
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_brand_id ON public.projects(brand_id);
CREATE INDEX IF NOT EXISTS idx_projects_goal_id ON public.projects(strategic_goal_id);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  concept_id UUID REFERENCES public.product_concepts(id) ON DELETE SET NULL,
  launch_id UUID REFERENCES public.launches(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority task_priority NOT NULL DEFAULT 'Medium',
  status task_status NOT NULL DEFAULT 'To Do',
  deadline DATE,
  assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_brand_id ON public.tasks(brand_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_launch_id ON public.tasks(launch_id);
CREATE INDEX IF NOT EXISTS idx_tasks_product_id ON public.tasks(product_id);
CREATE INDEX IF NOT EXISTS idx_tasks_concept_id ON public.tasks(concept_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON public.tasks(status, deadline);

-- -----------------------------------------------------------------------------
-- 12. COMPETITORS, MARKET_OPPORTUNITIES, RESEARCH (MARKET INTELLIGENCE, П. 8 ТЗ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  website_url TEXT NOT NULL DEFAULT '',
  marketplaces TEXT[] NOT NULL DEFAULT '{}',
  positioning TEXT NOT NULL DEFAULT '',
  price_range_rub TEXT NOT NULL DEFAULT '',
  key_products TEXT NOT NULL DEFAULT '',
  strengths TEXT NOT NULL DEFAULT '',
  weaknesses TEXT NOT NULL DEFAULT '',
  photos TEXT[] NOT NULL DEFAULT '{}',
  sources TEXT NOT NULL DEFAULT '',
  researched_at DATE NOT NULL DEFAULT CURRENT_DATE,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.market_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT '',
  competition_level TEXT NOT NULL DEFAULT 'Средняя',
  potential_demand TEXT NOT NULL DEFAULT '',
  economics_note TEXT NOT NULL DEFAULT '',
  complexity TEXT NOT NULL DEFAULT 'Средняя',
  priority task_priority NOT NULL DEFAULT 'High',
  linked_concept_ids UUID[] NOT NULL DEFAULT '{}',
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Тренды рынка',
  summary_conclusions TEXT NOT NULL DEFAULT '',
  source_links TEXT[] NOT NULL DEFAULT '{}',
  photos TEXT[] NOT NULL DEFAULT '{}',
  research_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 13. DOCUMENTS & AUDIT_LOG (ДОКУМЕНТЫ И АУДИТ, П. 13, 17 ТЗ)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  concept_id UUID REFERENCES public.product_concepts(id) ON DELETE SET NULL,
  launch_id UUID REFERENCES public.launches(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'производство', -- производство, поставщики, каталоги, дизайн, аналитика, маркетинг, финансы, стратегия, прочее
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL, -- путь в приватном бакете Supabase Storage
  tags TEXT[] NOT NULL DEFAULT '{}',
  min_role user_role NOT NULL DEFAULT 'Viewer',
  is_financial_restricted BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_brand_id ON public.documents(brand_id);
CREATE INDEX IF NOT EXISTS idx_documents_product_id ON public.documents(product_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT '',
  actor_role user_role NOT NULL DEFAULT 'Owner',
  entity_type TEXT NOT NULL, -- concept, product, launch, strategy, finance, task, document, user
  entity_id UUID,
  action TEXT NOT NULL, -- created, updated, status_changed, archived, exported, imported
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON public.audit_log(organization_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 14. ПРИВЯЗКА ТРИГГЕРОВ updated_at
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations', 'users', 'brands', 'strategies', 'product_concepts',
    'products', 'product_variants', 'product_economics', 'launches',
    'campaigns', 'growth_experiments', 'financial_plans', 'strategic_goals',
    'projects', 'tasks', 'competitors', 'market_opportunities', 'research', 'documents'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t, t);
  END LOOP;
END;
$$;
