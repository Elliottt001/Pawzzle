package com.pawzzle.domain.pet;

public record PetCardDTO(
    String id,
    String name,
    String breed,
    String age,
    String energy,
    String trait,
    String distance,
    String icon,
    String tone
) {
    public static PetCardDTO from(Pet pet) {
        if (pet == null) {
            return null;
        }
        String id = pet.getId() == null ? null : pet.getId().toString();
        return new PetCardDTO(
            id,
            pet.getName(),
            pet.getBreed(),
            pet.getAge(),
            pet.getEnergy(),
            pet.getTrait(),
            pet.getDistance(),
            pet.getIcon(),
            pet.getTone()
        );
    }
}
