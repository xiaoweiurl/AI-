package com.imagemanager.config;

/**
 * CORS 跨域配置
 * 
 * 注意：CORS 配置已统一在 SecurityConfig.corsConfigurationSource() 中管理。
 * 此类保留为空，避免与 SecurityConfig 中的 CORS 配置冲突。
 * 两个 CorsFilter 同时存在可能导致 CORS 行为不一致。
 */
// @Configuration  // 已禁用，CORS 由 SecurityConfig 统一管理
public class CorsConfig {
    // CORS 配置已迁移到 SecurityConfig.corsConfigurationSource()
}
