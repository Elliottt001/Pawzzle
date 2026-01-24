package com.pawzzle.domain.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;
    @Value("${wechat.app-id:}")
    private String wechatAppId;
    @Value("${wechat.app-secret:}")
    private String wechatAppSecret;

    public AuthResponse register(RegisterRequest request) {
        requireNonBlank(request.name(), "Name is required");
        requireNonBlank(request.password(), "Password is required");
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User.UserType userType = request.userType() == null ? User.UserType.INDIVIDUAL : request.userType();
        User.UserIntent finalIntent =
            request.userIntent() == null ? User.UserIntent.ADOPTER : request.userIntent();
        if (userType == User.UserType.INSTITUTION) {
            finalIntent = User.UserIntent.GIVER;
        }

        User user = User.builder()
            .name(request.name().trim())
            .email(email)
            .passwordHash(passwordEncoder.encode(request.password()))
            .userType(userType)
            .userIntent(finalIntent)
            .build();

        userRepository.save(user);
        UserSession session = createSession(user);

        return new AuthResponse(session.getToken(), toUserResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        requireNonBlank(request.password(), "Password is required");
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        UserSession session = createSession(user);
        return new AuthResponse(session.getToken(), toUserResponse(user));
    }

    public AuthResponse loginWithWeChat(WeChatLoginRequest request) {
        requireNonBlank(request.code(), "WeChat code is required");
        requireWeChatConfig();

        WeChatTokenResponse tokenResponse = requestWeChatToken(request.code().trim());
        String openId = tokenResponse.openid();
        String email = buildWeChatEmail(openId);
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseGet(() -> createWeChatUser(openId, tokenResponse.accessToken()));
        UserSession session = createSession(user);
        return new AuthResponse(session.getToken(), toUserResponse(user));
    }

    public AuthResponse loginInstitution(InstitutionLoginRequest request) {
        requireNonBlank(request.code(), "Institution code is required");
        String code = request.code().trim();
        String email = buildInstitutionEmail(code);
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User created = User.builder()
                .name("机构用户")
                .email(email)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .userType(User.UserType.INSTITUTION)
                .userIntent(User.UserIntent.GIVER)
                .build();
            return userRepository.save(created);
        });
        UserSession session = createSession(user);
        return new AuthResponse(session.getToken(), toUserResponse(user));
    }

    public AuthResponse loginWithWeChatMock() {
        String openId = "mock-" + UUID.randomUUID();
        User user = User.builder()
            .name("微信体验用户")
            .email(buildWeChatEmail(openId))
            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
            .userType(User.UserType.INDIVIDUAL)
            .userIntent(User.UserIntent.ADOPTER)
            .build();
        userRepository.save(user);
        UserSession session = createSession(user);
        return new AuthResponse(session.getToken(), toUserResponse(user));
    }

    public WeChatAppIdResponse getWeChatAppId() {
        String appId = normalizeWeChatAppId();
        if (appId == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "微信登录未配置");
        }
        return new WeChatAppIdResponse(appId);
    }

    @Transactional
    public void logout(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing token");
        }
        userSessionRepository.deleteByToken(token.trim());
    }

    private UserSession createSession(User user) {
        UserSession session = UserSession.builder()
            .user(user)
            .token(UUID.randomUUID().toString())
            .createdAt(Instant.now())
            .build();
        return userSessionRepository.save(session);
    }

    private void requireWeChatConfig() {
        if (normalizeWeChatAppId() == null || wechatAppSecret == null || wechatAppSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "微信登录未配置");
        }
    }

    private String normalizeWeChatAppId() {
        if (wechatAppId == null) {
            return null;
        }
        String trimmed = wechatAppId.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private User createWeChatUser(String openId, String accessToken) {
        String nickname = fetchWeChatNickname(accessToken, openId);
        if (nickname == null || nickname.isBlank()) {
            nickname = "微信用户";
        }
        User user = User.builder()
            .name(nickname.trim())
            .email(buildWeChatEmail(openId))
            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
            .userType(User.UserType.INDIVIDUAL)
            .userIntent(User.UserIntent.ADOPTER)
            .build();
        return userRepository.save(user);
    }

    private WeChatTokenResponse requestWeChatToken(String code) {
        RestTemplate restTemplate = new RestTemplate();
        String uri = UriComponentsBuilder.fromHttpUrl("https://api.weixin.qq.com/sns/oauth2/access_token")
            .queryParam("appid", wechatAppId)
            .queryParam("secret", wechatAppSecret)
            .queryParam("code", code)
            .queryParam("grant_type", "authorization_code")
            .toUriString();
        WeChatTokenResponse response = restTemplate.getForObject(uri, WeChatTokenResponse.class);
        if (response == null || response.openid() == null || response.accessToken() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "WeChat token response missing");
        }
        if (response.errcode() != null && response.errcode() != 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "WeChat token error: " + response.errmsg()
            );
        }
        return response;
    }

    private String fetchWeChatNickname(String accessToken, String openId) {
        RestTemplate restTemplate = new RestTemplate();
        String uri = UriComponentsBuilder.fromHttpUrl("https://api.weixin.qq.com/sns/userinfo")
            .queryParam("access_token", accessToken)
            .queryParam("openid", openId)
            .queryParam("lang", "zh_CN")
            .toUriString();
        WeChatProfileResponse response = restTemplate.getForObject(uri, WeChatProfileResponse.class);
        if (response == null) {
            return null;
        }
        if (response.errcode() != null && response.errcode() != 0) {
            return null;
        }
        return response.nickname();
    }

    private String buildWeChatEmail(String openId) {
        return "wechat:" + openId;
    }

    private String buildInstitutionEmail(String code) {
        return "institution:" + code;
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getUserType(), user.getUserIntent());
    }

    public record RegisterRequest(String name, String email, String password, User.UserType userType, User.UserIntent userIntent) {
    }

    public record LoginRequest(String email, String password) {
    }

    public record WeChatLoginRequest(String code) {
    }

    public record InstitutionLoginRequest(String code) {
    }

    public record AuthResponse(String token, UserResponse user) {
    }

    public record UserResponse(Long id, String name, String email, User.UserType userType, User.UserIntent userIntent) {
    }

    public record WeChatAppIdResponse(String appId) {
    }

    private record WeChatTokenResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("openid") String openid,
        @JsonProperty("errcode") Integer errcode,
        @JsonProperty("errmsg") String errmsg
    ) {
    }

    private record WeChatProfileResponse(
        @JsonProperty("nickname") String nickname,
        @JsonProperty("errcode") Integer errcode,
        @JsonProperty("errmsg") String errmsg
    ) {
    }
}
