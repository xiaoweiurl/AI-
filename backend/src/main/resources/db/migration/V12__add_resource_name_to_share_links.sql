-- 添加资源名称字段到分享链接表
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS resource_name VARCHAR(255);

-- 添加注释
COMMENT ON COLUMN share_links.resource_name IS '资源名称（冗余字段，用于显示）';
