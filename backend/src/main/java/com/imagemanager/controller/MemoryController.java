package com.imagemanager.controller;

import com.imagemanager.dto.MemorySearchResult;
import com.imagemanager.entity.KnowledgeCard;
import com.imagemanager.entity.KnowledgeDomain;
import com.imagemanager.service.MemoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/memory")
public class MemoryController {

    @Autowired
    private MemoryService memoryService;

    // ========== 知识域 ==========

    /**
     * 获取所有知识域
     */
    @GetMapping("/domains")
    public ResponseEntity<?> getDomains() {
        try {
            List<KnowledgeDomain> domains = memoryService.getAllDomains();
            return ResponseEntity.ok(Map.of("success", true, "domains", domains));
        } catch (Exception e) {
            log.error("获取知识域失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * 获取单个知识域
     */
    @GetMapping("/domains/{code}")
    public ResponseEntity<?> getDomain(@PathVariable String code) {
        try {
            KnowledgeDomain domain = memoryService.getDomainByCode(code);
            if (domain == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "知识域不存在"));
            }
            return ResponseEntity.ok(Map.of("success", true, "domain", domain));
        } catch (Exception e) {
            log.error("获取知识域失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // ========== 知识卡片 ==========

    /**
     * 创建知识卡片
     */
    @PostMapping("/cards")
    public ResponseEntity<?> createCard(@RequestBody Map<String, Object> request) {
        try {
            String domainCode = (String) request.get("domainCode");
            String title = (String) request.get("title");
            String content = (String) request.get("content");
            String[] tags = request.get("tags") != null ?
                    ((List<String>) request.get("tags")).toArray(new String[0]) : new String[0];
            String productCode = (String) request.get("productCode");
            String source = (String) request.get("source");
            String confidence = (String) request.get("confidence");
            String createdBy = (String) request.get("createdBy");

            if (domainCode == null || title == null || content == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "domainCode/title/content不能为空"));
            }

            KnowledgeCard card = memoryService.createCard(domainCode, title, content, tags,
                    productCode, source, confidence, createdBy != null ? createdBy : "anonymous");

            return ResponseEntity.ok(Map.of("success", true, "card", card));
        } catch (Exception e) {
            log.error("创建知识卡片失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", "创建知识卡片失败", "details", e.getMessage()));
        }
    }

    /**
     * 获取知识卡片列表
     */
    @GetMapping("/cards")
    public ResponseEntity<?> getCards(
            @RequestParam(required = false) String domainCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<KnowledgeCard> cards;

            if (domainCode != null && !domainCode.isEmpty()) {
                cards = memoryService.getCardsByDomain(domainCode, pageable);
            } else {
                cards = memoryService.getAllPublishedCards(pageable);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "cards", cards.getContent(),
                    "total", cards.getTotalElements(),
                    "page", cards.getNumber(),
                    "totalPages", cards.getTotalPages()
            ));
        } catch (Exception e) {
            log.error("获取知识卡片失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * 删除知识卡片
     */
    @DeleteMapping("/cards/{id}")
    public ResponseEntity<?> deleteCard(@PathVariable UUID id) {
        try {
            memoryService.deleteCard(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "删除成功"));
        } catch (Exception e) {
            log.error("删除知识卡片失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // ========== 语义检索 ==========

    /**
     * 语义检索知识卡片
     */
    @PostMapping("/search")
    public ResponseEntity<?> search(@RequestBody Map<String, Object> request) {
        try {
            String query = (String) request.get("query");
            String domainCode = (String) request.get("domainCode");
            double minScore = request.get("minScore") != null ?
                    ((Number) request.get("minScore")).doubleValue() : 0.5;
            int limit = request.get("limit") != null ?
                    ((Number) request.get("limit")).intValue() : 10;

            if (query == null || query.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "query不能为空"));
            }

            List<MemorySearchResult> results = memoryService.search(query, domainCode, minScore, limit);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "query", query,
                    "results", results,
                    "total", results.size()
            ));
        } catch (Exception e) {
            log.error("语义检索失败: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // ========== AI问答(SSE流式) ==========

    /**
     * AI问答 - SSE流式输出
     */
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@RequestBody Map<String, Object> request) {
        String message = (String) request.get("message");
        String domainCode = (String) request.get("domainCode");
        String sessionIdStr = (String) request.get("sessionId");
        UUID sessionId = sessionIdStr != null ? UUID.fromString(sessionIdStr) : UUID.randomUUID();

        if (message == null || message.isEmpty()) {
            SseEmitter emitter = new SseEmitter();
            try {
                emitter.send(SseEmitter.event().name("message").data(
                        "{\"type\":\"error\",\"content\":\"message不能为空\"}"));
                emitter.complete();
            } catch (Exception ignored) {}
            return emitter;
        }

        return memoryService.chat(message, sessionId, domainCode);
    }
}
