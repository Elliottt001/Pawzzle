package com.pawzzle.domain.order;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdoptionProcessRepository extends JpaRepository<AdoptionProcess, Long> {
	List<AdoptionProcess> findByStatusIn(List<AdoptionProcess.Status> statuses);

	Optional<AdoptionProcess> findByUserIdAndPetId(Long userId, Long petId);

	boolean existsByPetIdAndStatusIn(Long petId, List<AdoptionProcess.Status> statuses);

	List<AdoptionProcess> findByUserIdOrderByIdDesc(Long userId);
}
