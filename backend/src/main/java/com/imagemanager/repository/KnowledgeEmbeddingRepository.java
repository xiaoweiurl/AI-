package com.imagemanager.repository;

import com.imagemanager.entity.KnowledgeEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeEmbeddingRepository extends JpaRepository<KnowledgeEmbedding, UUID> {

    List<KnowledgeEmbedding> findByCardId(UUID cardId);

    @Modifying
    @Query("DELETE FROM KnowledgeEmbedding e WHERE e.cardId = :cardId")
    void deleteByCardId(@Param("cardId") UUID cardId);

    /**
     * 向量语义检索 - 使用pgvector余弦相似度
     * 返回格式: [card_id, title, content, domain_code, tags, product_code, source, confidence, created_by, created_at, chunk_text, score]
     */
    @Query(value = """
        SELECT c.id, c.title, c.content, c.domain_code, c.tags, c.product_code,
               c.source, c.confidence, c.created_by, c.created_at, e.chunk_text,
               1 - (e.embedding <=> :queryVector::vector) AS score
        FROM knowledge_embeddings e
        JOIN knowledge_cards c ON e.card_id = c.id
        WHERE c.status = 'published'
        AND (:domainCode IS NULL OR c.domain_code = :domainCode)
        AND 1 - (e.embedding <=> :queryVector::vector) >= :minScore
        ORDER BY e.embedding <=> :queryVector::vector
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> searchByVector(
            @Param("queryVector") String queryVector,
            @Param("domainCode") String domainCode,
            @Param("minScore") double minScore,
            @Param("limit") int limit
    );
}
