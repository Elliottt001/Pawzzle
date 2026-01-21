package com.pawzzle.domain.user;

import com.pawzzle.domain.vector.VectorStringConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnTransformer;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
	public enum UserType {
		INDIVIDUAL,
		INSTITUTION
	}

	public enum UserIntent {
		GIVER,
		ADOPTER
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(name = "user_type")
	private UserType userType;

	@Enumerated(EnumType.STRING)
	@Column(name = "user_intent")
	private UserIntent userIntent;

	@Column(columnDefinition = "text")
	private String preferenceSummary;

	@Convert(converter = VectorStringConverter.class)
	@ColumnTransformer(write = "?::vector")
	@Column(name = "preference_vector", columnDefinition = "vector(1536)")
	private List<Double> preferenceVector;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@PrePersist
	public void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}
}
