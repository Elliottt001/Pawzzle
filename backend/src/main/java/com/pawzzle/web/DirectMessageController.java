package com.pawzzle.web;

import com.pawzzle.domain.chat.ChatMessage;
import com.pawzzle.domain.chat.ChatMessageRepository;
import com.pawzzle.domain.chat.ChatThread;
import com.pawzzle.domain.chat.ChatThreadRepository;
import com.pawzzle.domain.pet.Pet;
import com.pawzzle.domain.pet.PetRepository;
import com.pawzzle.domain.user.SessionService;
import com.pawzzle.domain.user.User;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/threads")
@RequiredArgsConstructor
public class DirectMessageController {
    private final SessionService sessionService;
    private final PetRepository petRepository;
    private final ChatThreadRepository chatThreadRepository;
    private final ChatMessageRepository chatMessageRepository;

    @GetMapping
    public List<ChatThreadResponse> listThreads(
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        User currentUser = sessionService.requireUser(authorization, null);
        return chatThreadRepository.findByUserIdOrOwnerIdOrderByUpdatedAtDesc(
                currentUser.getId(),
                currentUser.getId()
            )
            .stream()
            .map((thread) -> toThreadResponse(thread, currentUser))
            .toList();
    }

    @GetMapping("/{id}")
    public ChatThreadResponse getThread(
        @PathVariable Long id,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        User currentUser = sessionService.requireUser(authorization, null);
        ChatThread thread = chatThreadRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));
        ensureParticipant(thread, currentUser);
        return toThreadResponse(thread, currentUser);
    }

    @PostMapping
    @Transactional
    public ChatThreadResponse createThread(
        @RequestBody CreateThreadRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        if (request == null) {
            throw badRequest("Missing request body");
        }
        User currentUser = sessionService.requireUser(authorization, request.token());
        Long ownerId = request.ownerId();
        Long petId = request.petId();
        if (petId == null) {
            throw badRequest("petId is required");
        }

        Pet pet = petRepository.findById(petId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet not found"));
        User owner = pet.getOwner();
        if (owner == null) {
            throw badRequest("Pet owner is missing");
        }
        if (ownerId != null && !owner.getId().equals(ownerId)) {
            throw badRequest("Pet owner does not match ownerId");
        }
        if (owner.getId().equals(currentUser.getId())) {
            throw badRequest("Cannot chat with yourself");
        }

        ChatThread thread = findExistingThread(currentUser, owner, pet);
        if (thread == null) {
            thread = chatThreadRepository.save(ChatThread.builder()
                .user(currentUser)
                .owner(owner)
                .pet(pet)
                .build());
        }
        return toThreadResponse(thread, currentUser);
    }

    @PostMapping("/{id}/messages")
    @Transactional
    public ChatMessageResponse sendMessage(
        @PathVariable Long id,
        @RequestBody SendMessageRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        User currentUser = sessionService.requireUser(
            authorization,
            request == null ? null : request.token()
        );
        ChatThread thread = chatThreadRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));
        ensureParticipant(thread, currentUser);
        String text = request == null ? null : normalize(request.text());
        if (text == null) {
            throw badRequest("Message text is required");
        }

        thread.setUpdatedAt(Instant.now());
        chatThreadRepository.save(thread);
        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
            .thread(thread)
            .sender(currentUser)
            .text(text)
            .build());
        return toMessageResponse(saved, currentUser);
    }

    private ChatThread findExistingThread(User currentUser, User owner, Pet pet) {
        return chatThreadRepository.findByUserIdAndOwnerIdAndPetId(
            currentUser.getId(),
            owner.getId(),
            pet.getId()
        ).orElse(null);
    }

    private void ensureParticipant(ChatThread thread, User currentUser) {
        Long currentId = currentUser.getId();
        if (currentId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        boolean isUser = currentId.equals(thread.getUser().getId());
        boolean isOwner = currentId.equals(thread.getOwner().getId());
        if (!isUser && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
    }

    private ChatThreadResponse toThreadResponse(ChatThread thread, User currentUser) {
        User otherUser = resolveOtherUser(thread, currentUser);
        Pet pet = thread.getPet();
        String petId = pet == null || pet.getId() == null ? null : pet.getId().toString();
        String petName = pet == null ? null : pet.getName();
        List<ChatMessageResponse> messages = chatMessageRepository
            .findByThreadIdOrderByCreatedAtAscIdAsc(thread.getId())
            .stream()
            .map((message) -> toMessageResponse(message, currentUser))
            .toList();
        return new ChatThreadResponse(
            thread.getId().toString(),
            otherUser.getId(),
            otherUser.getName(),
            petId,
            petName,
            messages
        );
    }

    private User resolveOtherUser(ChatThread thread, User currentUser) {
        Long currentId = currentUser.getId();
        if (currentId != null && currentId.equals(thread.getUser().getId())) {
            return thread.getOwner();
        }
        return thread.getUser();
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message, User currentUser) {
        boolean isSelf = message.getSender().getId().equals(currentUser.getId());
        String sender = isSelf ? "user" : "owner";
        long createdAt = message.getCreatedAt() == null ? 0 : message.getCreatedAt().toEpochMilli();
        return new ChatMessageResponse(
            message.getId().toString(),
            sender,
            message.getText(),
            createdAt
        );
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public record CreateThreadRequest(Long ownerId, Long petId, String token) {
    }

    public record SendMessageRequest(String text, String token) {
    }

    public record ChatThreadResponse(
        String id,
        Long ownerId,
        String ownerName,
        String petId,
        String petName,
        List<ChatMessageResponse> messages
    ) {
    }

    public record ChatMessageResponse(
        String id,
        String sender,
        String text,
        long createdAt
    ) {
    }
}
