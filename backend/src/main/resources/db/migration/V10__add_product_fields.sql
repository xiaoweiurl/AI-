-- 添加商品ID和主图标识字段
ALTER TABLE images ADD COLUMN IF NOT EXISTS product_id VARCHAR(255);
ALTER TABLE images ADD COLUMN IF NOT EXISTS is_main_image BOOLEAN DEFAULT FALSE;
ALTER TABLE images ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_images_product_id ON images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_is_main_image ON images(is_main_image);
