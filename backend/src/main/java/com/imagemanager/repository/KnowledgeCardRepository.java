package com.imagemanager.repository;

import com.imagemanager.entity.KnowledgeCard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeCardRepository extends JpaRepository<KnowledgeCard, UUID> {

    Page<KnowledgeCard> findByDomainCode(String domainCode, Pageable pageable);

    List<KnowledgeCard> findByDomainCodeOrderByCreatedAtDesc(String domainCode);

    Page<KnowledgeCard> findByDomainCodeAndStatus(String domainCode, String status, Pageable pageable);

    List<KnowledgeCard> findByProductCode(String productCode);

    @Query("SELECT c FROM KnowledgeCard c WHERE c.status = 'published' ORDER BY c.createdAt DESC")
    Page<KnowledgeCard> findAllPublished(Pageable pageable);

    @Query("SELECT COUNT(c) FROM KnowledgeCard c WHERE c.domainCode = :domainCode")
    long countByDomainCode(@Param("domainCode") String domainCode);

    @Modifying
    @Query("DELETE FROM KnowledgeCard c WHERE c.id = :id")
    void deleteById(@Param("id") UUID id);
}
