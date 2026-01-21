package com.pawzzle.domain.order;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdoptionProcessRepository extends JpaRepository<AdoptionProcess, Long> {
	List<AdoptionProcess> findByStatusIn(List<AdoptionProcess.Status> statuses);
}
