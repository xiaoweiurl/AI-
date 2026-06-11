-- ============================================================
-- 1. 丝袜产品报价单
-- ============================================================
DROP TABLE IF EXISTS product_quotation;
CREATE TABLE product_quotation (
    id SERIAL PRIMARY KEY,
    product_code TEXT,
    production_code TEXT,
    document_no TEXT,
    period TEXT,
    customer TEXT,
    salesperson TEXT,
    product_category TEXT,
    front_quotation_no TEXT,
    approval_status TEXT,
    sales_type TEXT,
    raw_material_name1 TEXT,
    material_usage1 NUMERIC(12,4),
    material_unit_price1 NUMERIC(12,4),
    raw_material_name2 TEXT,
    material_usage2 NUMERIC(12,4),
    material_unit_price2 NUMERIC(12,4),
    raw_material_name3 TEXT,
    material_usage3 NUMERIC(12,4),
    material_unit_price3 NUMERIC(12,4),
    raw_material_name4 TEXT,
    material_usage4 NUMERIC(12,4),
    material_unit_price4 NUMERIC(12,4),
    raw_material_name5 TEXT,
    material_usage5 NUMERIC(12,4),
    material_unit_price5 NUMERIC(12,4),
    raw_material_name6 TEXT,
    material_usage6 NUMERIC(12,4),
    material_unit_price6 NUMERIC(12,4),
    accessory_name TEXT,
    accessory_price NUMERIC(12,4),
    -- 制造成本字段
    weaving_seconds NUMERIC(12,2),       -- 织时（秒），即下机时间
    daily_output INTEGER,                 -- 日产量（条）
    equipment_daily_cost NUMERIC(12,4),   -- 设备日费率（元/天）
    weaving_cost NUMERIC(12,4),           -- 织造成本（元/条）
    yield_rate NUMERIC(5,2),              -- 正品率（%），如93表示93%
    sewing_weight NUMERIC(12,2),          -- 缝拼重量（克）
    sewing_cost NUMERIC(12,4),            -- 缝拼成本（元/条）
    dyeing_unit_price NUMERIC(12,4),      -- 染色单价 D（元/公斤）
    dyeing_cost NUMERIC(12,4),            -- 染色成本/后整理成本（元/条）
    setting_cost NUMERIC(12,4),           -- 定型成本（元/条）(旧公式保留)
    packaging_cost NUMERIC(12,4),         -- 包装成本（元/条）(旧公式保留)
    manufacturing_total NUMERIC(12,4),    -- 制造总成本 = 织造+后整理
    net_cost NUMERIC(12,4),              -- 净成本 = (原料+辅料+制造)/正品率×100
    sales_cost NUMERIC(12,4),            -- 销售成本 = 净成本+税金
    tax_amount NUMERIC(12,4),            -- 税金（元/条）
    machine_hourly_rate NUMERIC(12,4),    -- 机台小时费率 R（元/小时）
    single_machine_output_hourly NUMERIC(12,4) -- 单机产量 P（双/小时）
);
INSERT INTO product_quotation (product_code, production_code, document_no, period, customer, salesperson, product_category, front_quotation_no, approval_status, sales_type, raw_material_name1, material_usage1, material_unit_price1, raw_material_name2, material_usage2, material_unit_price2, raw_material_name3, material_usage3, material_unit_price3, raw_material_name4, material_usage4, material_unit_price4, raw_material_name5, material_usage5, material_unit_price5, raw_material_name6, material_usage6, material_unit_price6, accessory_name, accessory_price, weaving_seconds, daily_output, equipment_daily_cost, weaving_cost, yield_rate, sewing_weight, sewing_cost, dyeing_unit_price, dyeing_cost, setting_cost, packaging_cost, manufacturing_total, net_cost, sales_cost, tax_amount, machine_hourly_rate, single_machine_output_hourly) VALUES ('HT01-S', 'HTO1S', 'HDBJ0126040040', '2026/3/1-2026/4/25', '莎维亚/AC3059', '赵瑞', '丝袜', 'CPBJ0126030087', '已终审', '内销', 203030.0, 0.2, 0.245, '2070/48F', 2.0, 0.029, '50D/24F', 2.4, 0.0196, 'HD-XB30/12F', 0.4, 0.0222, 'XD40/2F', 4.6, 0.032, 'XF1202020', 7.8, 0.102, '6011牛皮纸盒', 0.181, 188, 460, 450, 0.0500, 93, 16.5, 0, 7.5000, 0.1238, 0, 0, 0.1738, 1.4400, 1.4400, 0, 50.0000, 1000.0000);
INSERT INTO product_quotation (product_code, production_code, document_no, period, customer, salesperson, product_category, front_quotation_no, approval_status, sales_type, raw_material_name1, material_usage1, material_unit_price1, raw_material_name2, material_usage2, material_unit_price2, raw_material_name3, material_usage3, material_unit_price3, raw_material_name4, material_usage4, material_unit_price4, raw_material_name5, material_usage5, material_unit_price5, raw_material_name6, material_usage6, material_unit_price6, accessory_name, accessory_price, weaving_seconds, daily_output, equipment_daily_cost, weaving_cost, yield_rate, sewing_weight, sewing_cost, dyeing_unit_price, dyeing_cost, setting_cost, packaging_cost, manufacturing_total, net_cost, sales_cost, tax_amount, machine_hourly_rate, single_machine_output_hourly) VALUES ('HT01-M', 'KTO1M', 'HDBJ0126040041', '2026/3/1-2026/4/25', '莎维亚/AC3059', '赵瑞锋', '丝袜', 'CPBJ0126030089', '已终审', '内销', '2070/48F', 2.0, 0.029, '50D/24F', 2.4, 0.0196, 'HD-XB30/12F', 0.4, 0.0222, 'XD40/2F', 5.0, 0.032, 'XF1202020', 8.2, 0.102, NULL, NULL, NULL, '6011牛皮纸盒', 0.181, 198, 436, 450, 0.0500, 93, 17.8, 0, 7.5000, 0.1335, 0, 0, 0.1835, 1.5130, 1.5130, 0, 50.0000, 1000.0000);
INSERT INTO product_quotation (product_code, production_code, document_no, period, customer, salesperson, product_category, front_quotation_no, approval_status, sales_type, raw_material_name1, material_usage1, material_unit_price1, raw_material_name2, material_usage2, material_unit_price2, raw_material_name3, material_usage3, material_unit_price3, raw_material_name4, material_usage4, material_unit_price4, raw_material_name5, material_usage5, material_unit_price5, raw_material_name6, material_usage6, material_unit_price6, accessory_name, accessory_price, weaving_seconds, daily_output, equipment_daily_cost, weaving_cost, yield_rate, sewing_weight, sewing_cost, dyeing_unit_price, dyeing_cost, setting_cost, packaging_cost, manufacturing_total, net_cost, sales_cost, tax_amount, machine_hourly_rate, single_machine_output_hourly) VALUES ('HT01-L', 'HTO1L', 'HDBJ0126040042', '2026/3/1-2026/4/25', '莎维亚/AC3059', '赵瑞锋', '丝袜', 'CPBJ0126030090', '已终审', '内销', '2070/48F', 2.0, 0.029, '50D/24F', 2.4, 0.0196, 'HD-KB30/12F', 0.4, 0.0222, 'XD40/2F', 5.6, 0.032, 'XF1202020', 8.8, 0.102, NULL, NULL, NULL, '6010条码不干胶', 0.181, 208, 415, 450, 0.0500, 93, 19, 0, 7.5000, 0.1425, 0, 0, 0.1925, 1.5872, 1.5872, 0, 50.0000, 1000.0000);
INSERT INTO product_quotation (product_code, production_code, document_no, period, customer, salesperson, product_category, front_quotation_no, approval_status, sales_type, raw_material_name1, material_usage1, material_unit_price1, raw_material_name2, material_usage2, material_unit_price2, raw_material_name3, material_usage3, material_unit_price3, raw_material_name4, material_usage4, material_unit_price4, raw_material_name5, material_usage5, material_unit_price5, raw_material_name6, material_usage6, material_unit_price6, accessory_name, accessory_price, weaving_seconds, daily_output, equipment_daily_cost, weaving_cost, yield_rate, sewing_weight, sewing_cost, dyeing_unit_price, dyeing_cost, setting_cost, packaging_cost, manufacturing_total, net_cost, sales_cost, tax_amount, machine_hourly_rate, single_machine_output_hourly) VALUES ('HT01-XL', 'XT01XL', 'HDBJ0126040043', '2026/3/1-2026/4/25', '莎维亚/AC3059', '赵瑞', '丝袜', 'CPBJ0126030091', '已终审', '内销', '2070/48F', 2.0, 0.029, '50D/24F', 2.4, 0.0196, 'HD-XB30/12F', 0.4, 0.0222, 'XD40/2F', 6.0, 0.032, 'XF1202020', 9.6, 0.102, NULL, NULL, NULL, '6011牛皮纸盒', 0.181, 210, 411, 450, 0.0500, 93, 20, 0, 7.5000, 0.1500, 0, 0, 0.2000, 1.6409, 1.6409, 0, 50.0000, 1000.0000);

-- ============================================================
-- 2. 原料入库
-- ============================================================
DROP TABLE IF EXISTS raw_material_warehouse;
CREATE TABLE raw_material_warehouse (
    id SERIAL PRIMARY KEY,
    product_code TEXT,
    color TEXT,
    batch_no TEXT,
    unit TEXT,
    unit_price NUMERIC(12,4)
);
INSERT INTO raw_material_warehouse (product_code, color, batch_no, unit, unit_price) VALUES ('XF1202020', '', 'G01201', '千克', 102.0);
INSERT INTO raw_material_warehouse (product_code, color, batch_no, unit, unit_price) VALUES ('XF4070', 'Z', 'G4706-1', '千克', 36.5);
INSERT INTO raw_material_warehouse (product_code, color, batch_no, unit, unit_price) VALUES ('XF2030', 'S', 'G2341', '千克', 33.0);
INSERT INTO raw_material_warehouse (product_code, color, batch_no, unit, unit_price) VALUES ('XF2030', 'Z', 'G2341', '千克', 33.0);
INSERT INTO raw_material_warehouse (product_code, color, batch_no, unit, unit_price) VALUES ('XB40/2', '', '', '千克', 28.0);
INSERT INTO raw_material_warehouse (product_code, color, batch_no, unit, unit_price) VALUES ('XB55/24F', 'S', 'JS5524W110', '千克', 19.6);
INSERT INTO raw_material_warehouse (product_code, color, batch_no, unit, unit_price) VALUES ('XB55/24F', 'Z', 'JS5524W110', '千克', 19.6);
INSERT INTO raw_material_warehouse (product_code, color, batch_no, unit, unit_price) VALUES ('XF2070/48F', 'Z', 'HDC27049T', '千克', 29.0);
INSERT INTO raw_material_warehouse (product_code, color, batch_no, unit, unit_price) VALUES ('XF2070/48F', 'S', 'HDC27049T', '千克', 29.0);

-- ============================================================
-- 3. 原料采购
-- ============================================================
DROP TABLE IF EXISTS raw_material_purchase;
CREATE TABLE raw_material_purchase (
    id SERIAL PRIMARY KEY,
    material_code TEXT,
    unit TEXT,
    supplier TEXT,
    batch_no TEXT,
    unit_price NUMERIC(12,4)
);
INSERT INTO raw_material_purchase (material_code, unit, supplier, batch_no, unit_price) VALUES ('2070/48F', '条', '精美纺织', 'DC27078', 0.029);
INSERT INTO raw_material_purchase (material_code, unit, supplier, batch_no, unit_price) VALUES ('2070/48F', '条', '精美纺织', 'DC27049W', 0.029);
INSERT INTO raw_material_purchase (material_code, unit, supplier, batch_no, unit_price) VALUES ('50D/24F', '条', '义乌华鼎锦纶有限公司', '-', 0.0196);
INSERT INTO raw_material_purchase (material_code, unit, supplier, batch_no, unit_price) VALUES ('HD-XB30/12F', '千克', '月源化纤', 317.0, 0.0222);
INSERT INTO raw_material_purchase (material_code, unit, supplier, batch_no, unit_price) VALUES ('XD40/2F', '千克', '无锡都灵化纤有限公司', 94.64, 0.032);
INSERT INTO raw_material_purchase (material_code, unit, supplier, batch_no, unit_price) VALUES ('XF1202020', '千克', '雅安百丝得包纱有限公司', 'G01201', 0.102);

-- ============================================================
-- 4. 生产计划
-- ============================================================
DROP TABLE IF EXISTS production_plan;
CREATE TABLE production_plan (
    id SERIAL PRIMARY KEY,
    semi_product_code TEXT,
    product_code TEXT,
    sewing_weight NUMERIC(12,4),
    machine_type TEXT,
    needle_count TEXT,
    seconds NUMERIC(12,4),
    machine_count INTEGER,
    single_machine_output NUMERIC(12,4)
);
INSERT INTO production_plan (semi_product_code, product_code, sewing_weight, machine_type, needle_count, seconds, machine_count, single_machine_output) VALUES ('HT01S', 'HT01-S', 16.5, '医疗机', '352N', 188, 1, 360);
INSERT INTO production_plan (semi_product_code, product_code, sewing_weight, machine_type, needle_count, seconds, machine_count, single_machine_output) VALUES ('HT01M', 'HT01-M', 17.8, '医疗机', '352N', 198, 1, 350);
INSERT INTO production_plan (semi_product_code, product_code, sewing_weight, machine_type, needle_count, seconds, machine_count, single_machine_output) VALUES ('HT01L', 'HT01-L', 19, '医疗机', '352N', 208, 1, 340);
INSERT INTO production_plan (semi_product_code, product_code, sewing_weight, machine_type, needle_count, seconds, machine_count, single_machine_output) VALUES ('HT01XL', 'HT01-XL', 20, '医疗机', '352N', 210, 1, 330);

-- ============================================================
-- 5. 辅料采购
-- ============================================================
DROP TABLE IF EXISTS accessory_purchase;
CREATE TABLE accessory_purchase (
    id SERIAL PRIMARY KEY,
    accessory_name TEXT,
    accessory_category TEXT,
    unit TEXT,
    supplier TEXT,
    accessory_unit_price NUMERIC(12,4)
);
INSERT INTO accessory_purchase (accessory_name, accessory_category, unit, supplier, accessory_unit_price) VALUES ('磨砂袋14.5*16.5', '包装袋', '个', '星际包装', 0.115);
INSERT INTO accessory_purchase (accessory_name, accessory_category, unit, supplier, accessory_unit_price) VALUES ('10.4*14.4CM', '纸板', '个', '义乌市春云包装厂', 0.035);
INSERT INTO accessory_purchase (accessory_name, accessory_category, unit, supplier, accessory_unit_price) VALUES ('10.4*14.4CM', '纸板', '个', '金华市凡贺包装有限公司', 0.035);
INSERT INTO accessory_purchase (accessory_name, accessory_category, unit, supplier, accessory_unit_price) VALUES ('金色尺码贴S', '其他', '个', '陈庆武', 0.015);
INSERT INTO accessory_purchase (accessory_name, accessory_category, unit, supplier, accessory_unit_price) VALUES ('金色尺码贴M', '其他', '个', '陈庆武', 0.015);
INSERT INTO accessory_purchase (accessory_name, accessory_category, unit, supplier, accessory_unit_price) VALUES ('金色尺码贴L', '其他', '个', '陈庆武', 0.015);
INSERT INTO accessory_purchase (accessory_name, accessory_category, unit, supplier, accessory_unit_price) VALUES ('金色尺码贴XL', '其他', '个', '陈庆武', 0.015);
INSERT INTO accessory_purchase (accessory_name, accessory_category, unit, supplier, accessory_unit_price) VALUES ('XX44*34*32', '纸箱', '个', '义乌市春云包装厂', 4.8);