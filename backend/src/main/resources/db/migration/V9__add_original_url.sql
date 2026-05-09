-- 添加 original_url 字段到 images 表
ALTER TABLE images ADD COLUMN IF NOT EXISTS original_url VARCHAR(500);
