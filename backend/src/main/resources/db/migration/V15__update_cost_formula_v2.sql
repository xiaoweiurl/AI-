-- ============================================================
-- 产品报价表 - 更新成本计算公式（V2）
-- 新公式:
--   成本价 = 原料成本 + 辅料成本 + 织造成本 + 后整理成本
--   原料成本 = Σ(mᵢ × pᵢ/1000)  用量(克) × 单价(元/千克)/1000
--   辅料成本 = Σ(qⱼ × cⱼ)        辅料数量 × 辅料单价
--   织造成本 = R/P                 机台小时费率(元/小时) / 单机产量(双/小时)
--   后整理成本 = M/1000 × D        下机克重(克)/1000 × 染色单价(元/公斤)
--   净成本 = 成本价 / 正品率 × 100
-- 参数: R=50元/小时, P=1000双/小时, D=7.5元/公斤
-- ============================================================

-- 1. 新增字段: 机台小时费率 R（元/小时）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS machine_hourly_rate NUMERIC(12,4);
COMMENT ON COLUMN product_quotation.machine_hourly_rate IS '机台小时费率 R（元/小时）';

-- 2. 新增字段: 单机产量 P（双/小时）
ALTER TABLE product_quotation ADD COLUMN IF NOT EXISTS single_machine_output_hourly NUMERIC(12,4);
COMMENT ON COLUMN product_quotation.single_machine_output_hourly IS '单机产量 P（双/小时）';

-- 3. 染色单价从 元/克 → 元/公斤（×1000）
-- 原 dyeing_unit_price = 0.0075 (元/克) → 7.5 (元/公斤)
UPDATE product_quotation SET dyeing_unit_price = dyeing_unit_price * 1000
WHERE dyeing_unit_price IS NOT NULL AND dyeing_unit_price < 1;
COMMENT ON COLUMN product_quotation.dyeing_unit_price IS '染色单价 D（元/公斤）';

-- 4. 设置 R=50, P=1000 并用新公式重新计算
-- ============================================================
-- HT01-S: M=16.5g, D=7.5元/kg
-- 织造成本 = 50/1000 = 0.05
-- 后整理成本 = 16.5/1000 × 7.5 = 0.12375
-- 制造合计 = 0.05 + 0.12375 = 0.17375
-- 成本价(原料+辅料+制造) 保持原有原料辅料数据
-- 净成本 = 成本价 / 93 × 100
-- ============================================================
UPDATE product_quotation SET
    machine_hourly_rate = 50,
    single_machine_output_hourly = 1000,
    weaving_cost = 0.0500,
    dyeing_cost = 0.1238,
    sewing_cost = 0,
    setting_cost = 0,
    packaging_cost = 0,
    manufacturing_total = 0.1738
WHERE product_code = 'HT01-S';

UPDATE product_quotation SET
    machine_hourly_rate = 50,
    single_machine_output_hourly = 1000,
    weaving_cost = 0.0500,
    dyeing_cost = 0.1335,
    sewing_cost = 0,
    setting_cost = 0,
    packaging_cost = 0,
    manufacturing_total = 0.1835
WHERE product_code = 'HT01-M';

UPDATE product_quotation SET
    machine_hourly_rate = 50,
    single_machine_output_hourly = 1000,
    weaving_cost = 0.0500,
    dyeing_cost = 0.1425,
    sewing_cost = 0,
    setting_cost = 0,
    packaging_cost = 0,
    manufacturing_total = 0.1925
WHERE product_code = 'HT01-L';

UPDATE product_quotation SET
    machine_hourly_rate = 50,
    single_machine_output_hourly = 1000,
    weaving_cost = 0.0500,
    dyeing_cost = 0.1500,
    sewing_cost = 0,
    setting_cost = 0,
    packaging_cost = 0,
    manufacturing_total = 0.2000
WHERE product_code = 'HT01-XL';

-- 5. 重新计算净成本
-- 成本价 = 原料成本 + 辅料成本 + 制造合计
-- 原料成本来自 material_unit_price1~6 × material_usage1~6
-- HT01-S: 原料≈0.7366, 辅料≈0.43, 制造≈0.1738 → 成本价≈1.3404
-- 净成本 = 1.3404 / 93 × 100 = 1.4400 (约)
-- HT01-M: 原料≈0.7936, 辅料≈0.43, 制造≈0.1835 → 成本价≈1.4071
-- 净成本 = 1.4071 / 93 × 100 = 1.5130 (约)
-- HT01-L: 原料≈0.8536, 辅料≈0.43, 制造≈0.1925 → 成本价≈1.4761
-- 净成本 = 1.4761 / 93 × 100 = 1.5872 (约)
-- HT01-XL: 原料≈0.8961, 辅料≈0.43, 制造≈0.2000 → 成本价≈1.5261
-- 净成本 = 1.5261 / 93 × 100 = 1.6409 (约)
UPDATE product_quotation SET net_cost = 1.4400, sales_cost = 1.4400 WHERE product_code = 'HT01-S';
UPDATE product_quotation SET net_cost = 1.5130, sales_cost = 1.5130 WHERE product_code = 'HT01-M';
UPDATE product_quotation SET net_cost = 1.5872, sales_cost = 1.5872 WHERE product_code = 'HT01-L';
UPDATE product_quotation SET net_cost = 1.6409, sales_cost = 1.6409 WHERE product_code = 'HT01-XL';
