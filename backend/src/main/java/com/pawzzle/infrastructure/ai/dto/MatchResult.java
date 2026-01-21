package com.pawzzle.infrastructure.ai.dto;

import com.pawzzle.domain.pet.Pet;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResult {
    private Pet bestPet;
    private String explanation;
    private Double confidence;
    private List<String> highlights;
    private List<Pet> candidates;
}
