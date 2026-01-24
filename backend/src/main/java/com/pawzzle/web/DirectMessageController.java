package com.pawzzle.web;

import com.pawzzle.domain.chat.ChatMessage;
import com.pawzzle.domain.chat.ChatMessageRepository;
import com.pawzzle.domain.chat.ChatThread;
import com.pawzzle.domain.chat.ChatThreadRepository;
import com.pawzzle.domain.order.AdoptionProcess;
import com.pawzzle.domain.order.AdoptionProcessRepository;
import com.pawzzle.domain.pet.Pet;
import com.pawzzle.domain.pet.PetRepository;
import com.pawzzle.domain.user.SessionService;
import com.pawzzle.domain.user.User;
import java.time.Instant;
import java.time.LocalDate;
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
    private final AdoptionProcessRepository adoptionProcessRepository;

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

    @PostMapping("/{id}/adoption")
    @Transactional
    public ChatThreadResponse requestAdoption(
        @PathVariable Long id,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        User currentUser = sessionService.requireUser(authorization, null);
        ChatThread thread = chatThreadRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));
        ensureParticipant(thread, currentUser);
        if (!currentUser.getId().equals(thread.getUser().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only adopter can request adoption");
        }
        Pet pet = thread.getPet();
        if (pet == null || pet.getId() == null) {
            throw badRequest("Pet is required");
        }

        AdoptionProcess existing = adoptionProcessRepository.findByUserIdAndPetId(
            thread.getUser().getId(),
            pet.getId()
        ).orElse(null);
        if (existing != null) {
            return toThreadResponse(thread, currentUser);
        }
        if (pet.getStatus() != Pet.Status.OPEN) {
            throw badRequest("Pet is not open for adoption");
        }
        boolean hasActive = adoptionProcessRepository.existsByPetIdAndStatusIn(
            pet.getId(),
            List.of(
                AdoptionProcess.Status.APPLY,
                AdoptionProcess.Status.SCREENING,
                AdoptionProcess.Status.TRIAL,
                AdoptionProcess.Status.ADOPTED
            )
        );
        if (hasActive) {
            throw badRequest("Pet already has an adoption process");
        }

        adoptionProcessRepository.save(AdoptionProcess.builder()
            .user(thread.getUser())
            .pet(pet)
            .status(AdoptionProcess.Status.APPLY)
            .build());
        chatMessageRepository.save(ChatMessage.builder()
            .thread(thread)
            .sender(currentUser)
            .text("我已提交领养申请，请确认。")
            .build());
        thread.setUpdatedAt(Instant.now());
        chatThreadRepository.save(thread);
        return toThreadResponse(thread, currentUser);
    }

    @PostMapping("/{id}/adoption/accept")
    @Transactional
    public ChatThreadResponse acceptAdoption(
        @PathVariable Long id,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        User currentUser = sessionService.requireUser(authorization, null);
        ChatThread thread = chatThreadRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found"));
        ensureParticipant(thread, currentUser);
        if (!currentUser.getId().equals(thread.getOwner().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner can accept adoption");
        }
        Pet pet = thread.getPet();
        if (pet == null || pet.getId() == null) {
            throw badRequest("Pet is required");
        }
        AdoptionProcess process = adoptionProcessRepository.findByUserIdAndPetId(
            thread.getUser().getId(),
            pet.getId()
        ).orElseThrow(() -> badRequest("Adoption request not found"));
        if (process.getStatus() == AdoptionProcess.Status.ADOPTED) {
            return toThreadResponse(thread, currentUser);
        }
        if (process.getStatus() != AdoptionProcess.Status.APPLY) {
            throw badRequest("Adoption request is not pending");
        }

        Instant now = Instant.now();
        process.setStatus(AdoptionProcess.Status.ADOPTED);
        process.setAdoptionDate(LocalDate.now());
        process.setAdoptedAt(now);
        adoptionProcessRepository.save(process);

        pet.setStatus(Pet.Status.ADOPTED);
        petRepository.save(pet);

        chatMessageRepository.save(ChatMessage.builder()
            .thread(thread)
            .sender(currentUser)
            .text("已同意领养申请，恭喜成为新主人！")
            .build());
        thread.setUpdatedAt(now);
        chatThreadRepository.save(thread);
        return toThreadResponse(thread, currentUser);
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
        String viewerRole = currentUser.getId().equals(thread.getOwner().getId()) ? "OWNER" : "ADOPTER";
        AdoptionSummary adoption = null;
        if (pet != null && pet.getId() != null) {
            adoption = adoptionProcessRepository.findByUserIdAndPetId(
                thread.getUser().getId(),
                pet.getId()
            ).map(this::toAdoptionSummary).orElse(null);
        }
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
            messages,
            viewerRole,
            adoption
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

    private AdoptionSummary toAdoptionSummary(AdoptionProcess process) {
        Long adoptedAt = process.getAdoptedAt() == null ? null : process.getAdoptedAt().toEpochMilli();
        return new AdoptionSummary(
            process.getId().toString(),
            process.getStatus().name(),
            adoptedAt
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
        List<ChatMessageResponse> messages,
        String viewerRole,
        AdoptionSummary adoption
    ) {
    }

    public record AdoptionSummary(
        String id,
        String status,
        Long adoptedAt
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
