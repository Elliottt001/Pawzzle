package com.pawzzle.web;

import com.pawzzle.infrastructure.ai.MatchingService;
import com.pawzzle.infrastructure.ai.dto.MatchResult;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final MatchingService matchingService;

    @Async("taskExecutor")
    @PostMapping
    public CompletableFuture<MatchResult> chat(@RequestBody ChatRequest request) {
        return matchingService.recommendPets(request.userId(), request.message());
    }

    public record ChatRequest(Long userId, String message) {
    }
}
