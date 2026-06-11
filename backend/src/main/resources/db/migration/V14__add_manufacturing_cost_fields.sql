-- ============================================================
-- 产品报价表 - 添加生产制造成本字段
-- 提取自 HT01 资料包（丝袜工艺单 + 产品报价单 + 包装工艺单）
-- 成本计算公式:
--   织造成本 = (下机时间/3600 × 机台小时费率) / 单机产量
--   后整理成本 = 缝拼 + 染色(下机重/1000×染色单价) + 定型 + 包装
--   净成本 = (原料 + 辅料 + 制造) / 正品率
--   销售成本 = 净成本 + 税金
-- ============================================================

-- 织时（秒），即下机时间
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS weaving_seconds NUMERIC(12,2);
-- 日产量（条）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS daily_output INTEGER;
-- 设备日费率（元/天），即机台小时费率×24
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS equipment_daily_cost NUMERIC(12,4);
-- 织造成本（元/条）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS weaving_cost NUMERIC(12,4);
-- 正品率（%），如93表示93%
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS yield_rate NUMERIC(5,2);
-- 缝拼重量（克）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS sewing_weight NUMERIC(12,2);
-- 缝拼成本（元/条）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS sewing_cost NUMERIC(12,4);
-- 染色单价（元/克）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS dyeing_unit_price NUMERIC(12,4);
-- 染色成本（元/条）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS dyeing_cost NUMERIC(12,4);
-- 定型成本（元/条）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS setting_cost NUMERIC(12,4);
-- 包装成本（元/条）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS packaging_cost NUMERIC(12,4);
-- 制造总成本（元/条）= 织造 + 缝拼 + 染色 + 定型 + 包装
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS manufacturing_total NUMERIC(12,4);
-- 净成本（元/条）= (原料 + 辅料 + 制造) / 正品率
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS net_cost NUMERIC(12,4);
-- 销售成本（元/条）= 净成本 + 税金
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS sales_cost NUMERIC(12,4);
-- 税金（元/条）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,4);

-- ============================================================
-- 更新 HT01-S 数据
-- 织时188秒, 日产量460条, 设备日费450元
-- 缝拼克重16.5g, 正品率93%
-- ============================================================
UPDATE product_quotation SET
    weaving_seconds = 188,
    daily_output = 460,
    equipment_daily_cost = 450,
    weaving_cost = 0.9780,
    yield_rate = 93,
    sewing_weight = 16.5,
    sewing_cost = 0.4300,
    dyeing_unit_price = 0.0075,
    dyeing_cost = 0.1240,
    setting_cost = 0.4500,
    packaging_cost = 0.4000,
    manufacturing_total = 3.4880,
    net_cost = 3.9186,
    sales_cost = 4.2321,
    tax_amount = 0.3135
WHERE product_code = 'HT01-S';

-- ============================================================
-- 更新 HT01-M 数据
-- 织时198秒, 日产量436条, 设备日费450元
-- 缝拼克重17.8g, 正品率93%
-- ============================================================
UPDATE product_quotation SET
    weaving_seconds = 198,
    daily_output = 436,
    equipment_daily_cost = 450,
    weaving_cost = 1.0320,
    yield_rate = 93,
    sewing_weight = 17.8,
    sewing_cost = 0.4300,
    dyeing_unit_price = 0.0075,
    dyeing_cost = 0.1340,
    setting_cost = 0.4500,
    packaging_cost = 0.4000,
    manufacturing_total = 3.5560,
    net_cost = 3.9914,
    sales_cost = 4.3107,
    tax_amount = 0.3193
WHERE product_code = 'HT01-M';

-- ============================================================
-- 更新 HT01-L 数据
-- 织时208秒, 日产量415条, 设备日费450元
-- 缝拼克重19g, 正品率93%
-- ============================================================
UPDATE product_quotation SET
    weaving_seconds = 208,
    daily_output = 415,
    equipment_daily_cost = 450,
    weaving_cost = 1.0840,
    yield_rate = 93,
    sewing_weight = 19,
    sewing_cost = 0.4300,
    dyeing_unit_price = 0.0075,
    dyeing_cost = 0.1430,
    setting_cost = 0.4500,
    packaging_cost = 0.4000,
    manufacturing_total = 3.6980,
    net_cost = 4.1433,
    sales_cost = 4.4748,
    tax_amount = 0.3315
WHERE product_code = 'HT01-L';

-- ============================================================
-- 更新 HT01-XL 数据
-- 织时210秒, 日产量411条, 设备日费450元
-- 缝拼克重20g, 正品率93%
-- ============================================================
UPDATE product_quotation SET
    weaving_seconds = 210,
    daily_output = 411,
    equipment_daily_cost = 450,
    weaving_cost = 1.0950,
    yield_rate = 93,
    sewing_weight = 20,
    sewing_cost = 0.4300,
    dyeing_unit_price = 0.0075,
    dyeing_cost = 0.1500,
    setting_cost = 0.4500,
    packaging_cost = 0.4000,
    manufacturing_total = 3.8100,
    net_cost = 4.2631,
    sales_cost = 4.6041,
    tax_amount = 0.3410
WHERE product_code = 'HT01-XL';
