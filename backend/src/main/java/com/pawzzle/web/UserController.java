package com.pawzzle.web;

import com.pawzzle.domain.pet.PetCardDTO;
import com.pawzzle.domain.pet.PetRepository;
import com.pawzzle.domain.user.User;
import com.pawzzle.domain.user.UserRepository;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final PetRepository petRepository;

    @GetMapping("/{id}")
    public UserProfileResponse getUserProfile(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        List<PetCardDTO> pets = petRepository.findByOwnerIdOrderByIdDesc(id).stream()
            .map(PetCardDTO::from)
            .filter(Objects::nonNull)
            .toList();
        return new UserProfileResponse(
            user.getId(),
            user.getName(),
            user.getUserType(),
            pets
        );
    }

    public record UserProfileResponse(
        Long id,
        String name,
        User.UserType userType,
        List<PetCardDTO> pets
    ) {
    }
}
