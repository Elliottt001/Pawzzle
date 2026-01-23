package com.pawzzle.domain.chat;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatThreadRepository extends JpaRepository<ChatThread, Long> {
    List<ChatThread> findByUserIdOrOwnerIdOrderByUpdatedAtDesc(Long userId, Long ownerId);

    Optional<ChatThread> findByUserIdAndOwnerIdAndPetId(Long userId, Long ownerId, Long petId);
}
