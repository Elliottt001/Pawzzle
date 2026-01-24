package com.pawzzle.domain.pet;

import com.fasterxml.jackson.databind.JsonNode;
import com.pawzzle.domain.user.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PetDTO {
    private Long id;
    private String name;
    private Pet.Species species;
    private Pet.Status status;
    private String description;
    private JsonNode tags;
    private String imageUrl;
    private Long ownerId;
    private String ownerName;
    private User.UserType ownerType;
}
