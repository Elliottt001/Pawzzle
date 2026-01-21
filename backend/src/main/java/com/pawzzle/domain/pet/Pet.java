package com.pawzzle.domain.pet;

import com.fasterxml.jackson.databind.JsonNode;
import com.pawzzle.domain.vector.VectorStringConverter;
import com.pawzzle.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "pets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Pet {
	public enum Species {
		CAT,
		DOG
	}

	public enum Status {
		OPEN,
		MATCHED,
		ADOPTED
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Species species;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Status status;

	@Column(name = "raw_description", columnDefinition = "text")
	private String rawDescription;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "structured_tags", columnDefinition = "jsonb")
	private JsonNode structuredTags;

	@Convert(converter = VectorStringConverter.class)
	@ColumnTransformer(write = "?::vector")
	@Column(name = "personality_vector", columnDefinition = "vector(1536)")
	private List<Double> personalityVector;

	@ManyToOne
	@JoinColumn(name = "owner_id")
	private User owner;
}
