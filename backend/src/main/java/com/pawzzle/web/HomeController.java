package com.pawzzle.web;

import com.pawzzle.domain.content.HomeContentItem;
import com.pawzzle.domain.content.HomeContentRepository;
import com.pawzzle.domain.pet.Pet;
import com.pawzzle.domain.pet.PetCardDTO;
import com.pawzzle.domain.pet.PetRepository;
import com.pawzzle.domain.user.SessionService;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {
    private final PetRepository petRepository;
    private final HomeContentRepository homeContentRepository;
    private final SessionService sessionService;

    @GetMapping
    public HomeResponse getHomeData() {
        List<PetCardDTO> petCards = petRepository.findByStatus(Pet.Status.OPEN).stream()
            .map(PetCardDTO::from)
            .filter(Objects::nonNull)
            .toList();
        List<HomeContentDTO> updates = toContentList(HomeContentItem.Category.UPDATE);
        List<HomeContentDTO> guides = toContentList(HomeContentItem.Category.GUIDE);
        return new HomeResponse(petCards, updates, guides);
    }

    @PostMapping("/content")
    public HomeContentDTO createContent(
        @RequestBody CreateContentRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        sessionService.requireUser(authorization, request.token());
        CreateContentPayload payload = validateCreateRequest(request);
        int sortOrder = nextSortOrder(payload.category());
        HomeContentItem item = HomeContentItem.builder()
            .category(payload.category())
            .title(payload.title())
            .subtitle(payload.subtitle())
            .tag(payload.tag())
            .tone(payload.tone())
            .sortOrder(sortOrder)
            .build();
        HomeContentItem saved = homeContentRepository.save(item);
        return toContent(saved);
    }

    private List<HomeContentDTO> toContentList(HomeContentItem.Category category) {
        return homeContentRepository.findByCategoryOrderBySortOrderAscIdAsc(category).stream()
            .map(this::toContent)
            .toList();
    }

    private HomeContentDTO toContent(HomeContentItem item) {
        String id = item.getId() == null ? null : item.getId().toString();
        return new HomeContentDTO(id, item.getTitle(), item.getSubtitle(), item.getTag(), item.getTone());
    }

    private CreateContentPayload validateCreateRequest(CreateContentRequest request) {
        if (request == null) {
            throw badRequest("Missing request body");
        }
        HomeContentItem.Category category = parseCategory(request.category());
        String title = normalize(request.title());
        String subtitle = normalize(request.subtitle());
        if (title == null || subtitle == null) {
            throw badRequest("Title and subtitle are required");
        }
        String tag = normalize(request.tag());
        String tone = normalize(request.tone());
        if (tag == null) {
            tag = category == HomeContentItem.Category.UPDATE ? "Update" : "Guide";
        }
        if (tone == null) {
            tone = category == HomeContentItem.Category.UPDATE ? "#FCE7CF" : "#EAF2FF";
        }
        return new CreateContentPayload(category, title, subtitle, tag, tone);
    }

    private HomeContentItem.Category parseCategory(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw badRequest("Category is required");
        }
        try {
            return HomeContentItem.Category.valueOf(normalized.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw badRequest("Category must be UPDATE or GUIDE");
        }
    }

    private int nextSortOrder(HomeContentItem.Category category) {
        Integer last = homeContentRepository.findByCategoryOrderBySortOrderAscIdAsc(category).stream()
            .map(HomeContentItem::getSortOrder)
            .filter(Objects::nonNull)
            .reduce((first, second) -> second)
            .orElse(null);
        return (last == null ? 0 : last) + 1;
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

    public record HomeResponse(
        List<PetCardDTO> petCards,
        List<HomeContentDTO> updates,
        List<HomeContentDTO> guides
    ) {
    }

    public record HomeContentDTO(
        String id,
        String title,
        String subtitle,
        String tag,
        String tone
    ) {
    }

    public record CreateContentRequest(
        String category,
        String title,
        String subtitle,
        String tag,
        String tone,
        String token
    ) {
    }

    private record CreateContentPayload(
        HomeContentItem.Category category,
        String title,
        String subtitle,
        String tag,
        String tone
    ) {
    }
}
