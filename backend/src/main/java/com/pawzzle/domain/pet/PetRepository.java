package com.pawzzle.domain.pet;

import com.pawzzle.domain.vector.VectorSqlUtils;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetRepository extends JpaRepository<Pet, Long> {
	boolean existsByName(String name);

	List<Pet> findByStatus(Pet.Status status);

	List<Pet> findByOwnerIdOrderByIdDesc(Long ownerId);

	@Query(value = """
		select *
		from pets p
		where (:species is null or p.species = :species)
		  and p.status = 'OPEN'
		order by p.personality_vector <=> cast(:#{T(com.pawzzle.domain.vector.VectorSqlUtils).toVector(#userVector)} as vector)
		limit :limit
		""", nativeQuery = true)
	List<Pet> hybridSearch(
		@Param("species") String species,
		@Param("userVector") List<Double> userVector,
		@Param("limit") int limit
	);
}
