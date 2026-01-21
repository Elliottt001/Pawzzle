package com.pawzzle.infrastructure.ai;

import com.pawzzle.domain.order.AdoptionProcess;
import com.pawzzle.domain.order.AdoptionProcessRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LifecyclePushService {
    private static final Set<Long> MILESTONES = Set.of(1L, 3L, 7L, 14L, 30L);

    private final AdoptionProcessRepository adoptionProcessRepository;
    private final OpenAiChatClient chatClient;

    @Scheduled(cron = "0 0 10 * * ?")
    public void sendLifecyclePushes() {
        List<AdoptionProcess> processes = adoptionProcessRepository.findByStatusIn(
            List.of(AdoptionProcess.Status.TRIAL, AdoptionProcess.Status.ADOPTED)
        );

        LocalDate today = LocalDate.now();

        for (AdoptionProcess process : processes) {
            LocalDate adoptionDate = process.getAdoptionDate();
            if (adoptionDate == null) {
                continue;
            }

            long daysSinceAdoption = ChronoUnit.DAYS.between(adoptionDate, today);
            if (!MILESTONES.contains(daysSinceAdoption)) {
                continue;
            }

            String message = callChat(buildPrompt(process, daysSinceAdoption));
            System.out.println("Lifecycle Push -> " + message);
        }
    }

    private String buildPrompt(AdoptionProcess process, long daysSinceAdoption) {
        return """
            It is Day %d of adopting %s (Species: %s).
            The user is %s.
            Generate a short, encouraging tip or check-in question.
            """.formatted(
            daysSinceAdoption,
            process.getPet().getName(),
            process.getPet().getSpecies(),
            process.getUser().getName()
        );
    }

    private String callChat(String userPrompt) {
        Prompt prompt = new Prompt(List.of(
            new SystemMessage("You are a supportive adoption coach."),
            new UserMessage(userPrompt)
        ));
        ChatResponse response = chatClient.call(prompt);
        return response.getResult().getOutput().getContent().trim();
    }
}
