package com.imagemanager.service;

import com.imagemanager.dto.MemorySearchResult;
import com.imagemanager.entity.KnowledgeCard;
import com.imagemanager.entity.KnowledgeDomain;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface MemoryService {

    /** 获取所有知识域 */
    List<KnowledgeDomain> getAllDomains();

    /** 获取知识域详情 */
    KnowledgeDomain getDomainByCode(String code);

    /** 创建知识卡片(自动向量化) */
    KnowledgeCard createCard(String domainCode, String title, String content,
                             String[] tags, String productCode, String source,
                             String confidence, String createdBy);

    /** 获取知识域下的卡片列表 */
    Page<KnowledgeCard> getCardsByDomain(String domainCode, Pageable pageable);

    /** 获取所有已发布卡片 */
    Page<KnowledgeCard> getAllPublishedCards(Pageable pageable);

    /** 删除知识卡片(含向量) */
    void deleteCard(UUID cardId);

    /** 语义检索 */
    List<MemorySearchResult> search(String query, String domainCode, double minScore, int limit);

    /** AI对话(SSE流式) */
    SseEmitter chat(String message, UUID sessionId, String domainCode);
}
