package com.pawzzle.web;

import com.pawzzle.infrastructure.ai.LifecyclePushService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trigger-push")
@RequiredArgsConstructor
public class AdminController {
    private final LifecyclePushService lifecyclePushService;

    @PostMapping
    public void triggerPush() {
        lifecyclePushService.sendLifecyclePushes();
    }
}
