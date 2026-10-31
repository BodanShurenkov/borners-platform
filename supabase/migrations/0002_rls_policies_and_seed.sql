-- =============================================================================
-- BORNERS GROUP — STRATEGY & PRODUCT DEVELOPMENT PLATFORM
-- Migration: 0002_rls_policies_and_seed.sql
-- Description: Row-Level Security (RLS) политики по ролям (п. 15, 16 ТЗ)
--              и демонстрационные данные (BORNERS, НА ТЕЛЕ, BIG LOVE, Skin Tone)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ВСПОМОГАТЕЛЬНЫЕ SECURITY DEFINER ФУНКЦИИ ДЛЯ RLS (ОПТИМИЗИРОВАННЫЕ)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_app_user()
RETURNS public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.users
  WHERE auth_user_id = (SELECT auth.uid())
    AND is_active = true
    AND is_archived = false
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_org_access(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = (SELECT auth.uid())
      AND u.organization_id = p_org_id
      AND u.is_active = true
      AND u.is_archived = false
  );
$$;

CREATE OR REPLACE FUNCTION public.has_brand_access(p_org_id UUID, p_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = (SELECT auth.uid())
      AND u.organization_id = p_org_id
      AND u.is_active = true
      AND (
        u.role IN ('Owner', 'Admin', 'Viewer')
        OR p_brand_id IS NULL
        OR p_brand_id = ANY(u.assigned_brand_ids)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_brand(p_org_id UUID, p_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = (SELECT auth.uid())
      AND u.organization_id = p_org_id
      AND u.is_active = true
      AND (
        u.role IN ('Owner', 'Admin')
        OR (u.role = 'Manager' AND (p_brand_id IS NULL OR p_brand_id = ANY(u.assigned_brand_ids)))
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_finance(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = (SELECT auth.uid())
      AND u.organization_id = p_org_id
      AND u.is_active = true
      AND (u.role IN ('Owner', 'Admin') OR u.can_view_finance = true)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_cost_price(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = (SELECT auth.uid())
      AND u.organization_id = p_org_id
      AND u.is_active = true
      AND (u.role IN ('Owner', 'Admin') OR u.can_view_cost_price = true)
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. ВКЛЮЧЕНИЕ RLS НА ВСЕХ ТАБЛИЦАХ (П. 16 ТЗ: RLS НЕ ОТКЛЮЧАТЬ)
-- -----------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_economics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. ПОЛИТИКИ ДОСТУПА ПО РОЛЯМ (П. 15 ТЗ)
-- -----------------------------------------------------------------------------

-- Организация и пользователи
CREATE POLICY org_select_policy ON public.organizations
  FOR SELECT USING (public.has_org_access(id));

CREATE POLICY users_select_policy ON public.users
  FOR SELECT USING (public.has_org_access(organization_id));

CREATE POLICY users_admin_write_policy ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.organization_id = users.organization_id
        AND u.role IN ('Owner', 'Admin')
    )
  );

-- Бренды
CREATE POLICY brands_select_policy ON public.brands
  FOR SELECT USING (public.has_brand_access(organization_id, id));

CREATE POLICY brands_write_policy ON public.brands
  FOR ALL USING (public.can_write_brand(organization_id, id));

-- Стратегии брендов (Partner не имеет доступа к стратегии; утверждённые блоки меняют только Owner/Admin)
CREATE POLICY strategies_select_policy ON public.strategies
  FOR SELECT USING (
    public.has_brand_access(organization_id, brand_id)
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.role <> 'Partner'
    )
  );

CREATE POLICY strategies_write_policy ON public.strategies
  FOR ALL USING (
    public.can_write_brand(organization_id, brand_id)
    AND (
      status <> 'approved'
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_user_id = (SELECT auth.uid())
          AND u.role IN ('Owner', 'Admin')
      )
    )
  );

-- Product Lab (product_concepts)
CREATE POLICY concepts_select_policy ON public.product_concepts
  FOR SELECT USING (public.has_brand_access(organization_id, brand_id));

CREATE POLICY concepts_write_policy ON public.product_concepts
  FOR ALL USING (public.can_write_brand(organization_id, brand_id));

-- Продукты, варианты и ассеты
CREATE POLICY products_select_policy ON public.products
  FOR SELECT USING (public.has_brand_access(organization_id, brand_id));

CREATE POLICY products_write_policy ON public.products
  FOR ALL USING (public.can_write_brand(organization_id, brand_id));

CREATE POLICY variants_select_policy ON public.product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
        AND public.has_brand_access(p.organization_id, p.brand_id)
    )
  );

CREATE POLICY variants_write_policy ON public.product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
        AND public.can_write_brand(p.organization_id, p.brand_id)
    )
  );

-- Закупочные цены и юнит-экономика (ОТДЕЛЬНОЕ ОГРАНИЧЕНИЕ, п. 15 ТЗ!)
CREATE POLICY product_economics_select_policy ON public.product_economics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_economics.product_id
        AND public.can_access_cost_price(p.organization_id)
    )
  );

CREATE POLICY product_economics_write_policy ON public.product_economics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_economics.product_id
        AND public.can_access_cost_price(p.organization_id)
        AND public.can_write_brand(p.organization_id, p.brand_id)
    )
  );

-- Финансовые планы (ОТДЕЛЬНОЕ ОГРАНИЧЕНИЕ НА ФИНАНСЫ, п. 15 ТЗ!)
CREATE POLICY financial_plans_select_policy ON public.financial_plans
  FOR SELECT USING (
    public.can_access_finance(organization_id)
    AND public.has_brand_access(organization_id, brand_id)
  );

CREATE POLICY financial_plans_write_policy ON public.financial_plans
  FOR ALL USING (
    public.can_access_finance(organization_id)
    AND public.can_write_brand(organization_id, brand_id)
  );

-- Запуски, кампании, цели, проекты, задачи
CREATE POLICY launches_select_policy ON public.launches
  FOR SELECT USING (public.has_brand_access(organization_id, brand_id));

CREATE POLICY launches_write_policy ON public.launches
  FOR ALL USING (public.can_write_brand(organization_id, brand_id));

CREATE POLICY campaigns_select_policy ON public.campaigns
  FOR SELECT USING (public.has_brand_access(organization_id, brand_id));

CREATE POLICY campaigns_write_policy ON public.campaigns
  FOR ALL USING (public.can_write_brand(organization_id, brand_id));

CREATE POLICY tasks_select_policy ON public.tasks
  FOR SELECT USING (public.has_brand_access(organization_id, brand_id));

CREATE POLICY tasks_write_policy ON public.tasks
  FOR ALL USING (public.can_write_brand(organization_id, brand_id));

-- Приватные документы с проверкой финансовых ограничений (п. 13, 15 ТЗ)
CREATE POLICY documents_select_policy ON public.documents
  FOR SELECT USING (
    public.has_brand_access(organization_id, brand_id)
    AND (is_financial_restricted = false OR public.can_access_finance(organization_id))
  );

CREATE POLICY documents_write_policy ON public.documents
  FOR ALL USING (
    public.can_write_brand(organization_id, brand_id)
    AND (is_financial_restricted = false OR public.can_access_finance(organization_id))
  );

-- Журнал аудита
CREATE POLICY audit_log_select_policy ON public.audit_log
  FOR SELECT USING (public.has_org_access(organization_id));

CREATE POLICY audit_log_insert_policy ON public.audit_log
  FOR INSERT WITH CHECK (public.has_org_access(organization_id));

-- -----------------------------------------------------------------------------
-- 4. ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ (SEED DATA — П. 23 ТЗ, МАРКИРОВКА is_demo = true)
-- -----------------------------------------------------------------------------
INSERT INTO public.organizations (id, name, slug, default_currency)
VALUES ('11111111-1111-4111-8111-111111111111', 'BORNERS GROUP', 'borners-group', 'RUB')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.brands (id, organization_id, code, name, tagline, segment, description, accent_color, secondary_color, target_margin_pct, is_demo)
VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111111',
    'BORNERS',
    'BORNERS',
    'Массовый бренд доступного качественного и интересного белья',
    'Mass-Market+ / Marketplace Leader',
    'Масштабирование маркетплейсов (WB, Ozon, Яндекс Маркет), базовые и лимитированные коллекции (BIG LOVE), быстрые продуктовые эксперименты, контроль себестоимости и высокий LTV повторных покупок.',
    '#D97745',
    '#111111',
    44.50,
    true
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111111',
    'NA_TELE',
    'НА ТЕЛЕ',
    'Премиальное бельё с акцентом на эстетику, посадку, материалы и комфорт',
    'Premium D2C & Select Retail',
    'Собственный анатомический дизайн, палитра оттенков кожи (Skin Tone Collection), тактильная премиальная упаковка, клубная лояльность и поэтапное развитие собственного D2C-канала.',
    '#8B8078',
    '#171717',
    56.00,
    true
  )
ON CONFLICT (organization_id, code) DO NOTHING;
