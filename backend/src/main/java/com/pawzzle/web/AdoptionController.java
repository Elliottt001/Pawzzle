package com.pawzzle.web;

import com.pawzzle.domain.order.AdoptionProcess;
import com.pawzzle.domain.order.AdoptionProcessRepository;
import com.pawzzle.domain.pet.PetCardDTO;
import com.pawzzle.domain.user.SessionService;
import com.pawzzle.domain.user.User;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/adoptions")
@RequiredArgsConstructor
public class AdoptionController {
    private final SessionService sessionService;
    private final AdoptionProcessRepository adoptionProcessRepository;

    @GetMapping
    public List<AdoptionSummary> listAdoptions(
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        User currentUser = sessionService.requireUser(authorization, null);
        return adoptionProcessRepository.findByUserIdOrderByIdDesc(currentUser.getId())
            .stream()
            .map(this::toSummary)
            .toList();
    }

    private AdoptionSummary toSummary(AdoptionProcess process) {
        PetCardDTO pet = PetCardDTO.from(process.getPet());
        Long adoptedAt = process.getAdoptedAt() == null ? null : process.getAdoptedAt().toEpochMilli();
        return new AdoptionSummary(
            process.getId() == null ? null : process.getId().toString(),
            pet,
            process.getStatus().name(),
            adoptedAt
        );
    }

    public record AdoptionSummary(
        String id,
        PetCardDTO pet,
        String status,
        Long adoptedAt
    ) {
    }
}
