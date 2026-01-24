package com.pawzzle.web;

import com.pawzzle.domain.user.AuthService;
import com.pawzzle.domain.user.AuthService.AuthResponse;
import com.pawzzle.domain.user.AuthService.InstitutionLoginRequest;
import com.pawzzle.domain.user.AuthService.LoginRequest;
import com.pawzzle.domain.user.AuthService.RegisterRequest;
import com.pawzzle.domain.user.AuthService.WeChatAppIdResponse;
import com.pawzzle.domain.user.AuthService.WeChatLoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/wechat")
    public AuthResponse wechatLogin(@RequestBody WeChatLoginRequest request) {
        return authService.loginWithWeChat(request);
    }

    @PostMapping("/wechat/mock")
    public AuthResponse wechatMockLogin() {
        return authService.loginWithWeChatMock();
    }

    @GetMapping("/wechat/app-id")
    public WeChatAppIdResponse wechatAppId() {
        return authService.getWeChatAppId();
    }

    @PostMapping("/institution")
    public AuthResponse institutionLogin(@RequestBody InstitutionLoginRequest request) {
        return authService.loginInstitution(request);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody(required = false) LogoutRequest request
    ) {
        String token = extractToken(authorization, request);
        authService.logout(token);
        return ResponseEntity.noContent().build();
    }

    private String extractToken(String authorization, LogoutRequest request) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return authorization.substring("Bearer ".length()).trim();
        }
        if (request != null && request.token() != null) {
            return request.token().trim();
        }
        return null;
    }

    public record LogoutRequest(String token) {
    }
}
