-- 为智能对话历史添加思维链字段（DeepSeek思考模式）
ALTER TABLE smart_chat_history ADD COLUMN IF NOT EXISTS reasoning_content TEXT;

-- 索引（可选，便于后续查询带思维链的消息）
COMMENT ON COLUMN smart_chat_history.reasoning_content IS 'DeepSeek思考模式下的思维链内容';
