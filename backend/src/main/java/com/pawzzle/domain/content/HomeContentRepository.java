package com.pawzzle.domain.content;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HomeContentRepository extends JpaRepository<HomeContentItem, Long> {
    boolean existsByCategoryAndTitle(HomeContentItem.Category category, String title);

    List<HomeContentItem> findByCategoryOrderBySortOrderAscIdAsc(HomeContentItem.Category category);
}
