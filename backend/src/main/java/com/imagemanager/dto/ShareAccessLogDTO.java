package com.imagemanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 分享访问记录 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareAccessLogDTO {
    
    private String id;
    
    /**
     * 分享链接ID
     */
    private String shareLinkId;
    
    /**
     * 访问者IP
     */
    private String visitorIp;
    
    /**
     * 访问类型：view, download
     */
    private String accessType;
    
    /**
     * 访问时间
     */
    private LocalDateTime accessTime;
    
    /**
     * 用户代理
     */
    private String userAgent;
    
    /**
     * 是否验证成功
     */
    private Boolean success;
}
