package com.pawzzle.domain.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final UserSessionRepository userSessionRepository;

    public User requireUser(String authorization, String tokenFromBody) {
        String token = extractToken(authorization, tokenFromBody);
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        UserSession session = userSessionRepository.findByToken(token.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid session"));
        return session.getUser();
    }

    private String extractToken(String authorization, String tokenFromBody) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring("Bearer ".length()).trim();
        }
        if (tokenFromBody != null && !tokenFromBody.isBlank()) {
            return tokenFromBody.trim();
        }
        return null;
    }
}
