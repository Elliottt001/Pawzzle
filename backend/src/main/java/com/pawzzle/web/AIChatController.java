package com.pawzzle.web;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AIChatController {

    private final OpenAiChatClient chatClient;

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@RequestBody(required = false) ChatRequest request) {
        SseEmitter emitter = new SseEmitter(60_000L);
        String message = normalizeText(request == null ? null : request.message());
        if (message == null) {
            emitter.completeWithError(new IllegalArgumentException("Message is required."));
            return emitter;
        }

        Prompt prompt = new Prompt(List.of(new UserMessage(message)));
        Flux<ChatResponse> stream = chatClient.stream(prompt);

        AtomicReference<Disposable> subscriptionRef = new AtomicReference<>();
        Runnable dispose = () -> {
            Disposable subscription = subscriptionRef.getAndSet(null);
            if (subscription != null && !subscription.isDisposed()) {
                subscription.dispose();
            }
        };

        Disposable subscription = stream.subscribe(
            response -> {
                String content = response.getResult().getOutput().getContent();
                if (content == null || content.isEmpty()) {
                    return;
                }
                try {
                    emitter.send(
                        SseEmitter.event().data(new StreamChunk(content, false), MediaType.APPLICATION_JSON));
                } catch (Exception ex) {
                    dispose.run();
                    emitter.completeWithError(ex);
                }
            },
            ex -> {
                dispose.run();
                emitter.completeWithError(ex);
            },
            () -> {
                try {
                    emitter.send(SseEmitter.event().data(new StreamChunk(null, true), MediaType.APPLICATION_JSON));
                    emitter.complete();
                } catch (Exception ex) {
                    emitter.completeWithError(ex);
                } finally {
                    dispose.run();
                }
            }
        );

        subscriptionRef.set(subscription);
        emitter.onCompletion(dispose);
        emitter.onTimeout(() -> {
            dispose.run();
            emitter.complete();
        });

        return emitter;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public record ChatRequest(String message) {
    }

    public record StreamChunk(String content, boolean done) {
    }
}
