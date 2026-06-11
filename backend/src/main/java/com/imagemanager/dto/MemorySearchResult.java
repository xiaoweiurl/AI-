package com.imagemanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemorySearchResult {

    private UUID id;
    private String domainCode;
    private String domainName;
    private String domainIcon;
    private String domainColor;
    private String title;
    private String content;
    private String[] tags;
    private String productCode;
    private String source;
    private String confidence;
    private String createdBy;
    private LocalDateTime createdAt;
    private String chunkText;
    private Double score;
}
