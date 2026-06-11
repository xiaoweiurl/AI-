package com.imagemanager.repository;

import com.imagemanager.entity.KnowledgeChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeChatHistoryRepository extends JpaRepository<KnowledgeChatHistory, UUID> {

    List<KnowledgeChatHistory> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);

    long countBySessionId(UUID sessionId);
}
