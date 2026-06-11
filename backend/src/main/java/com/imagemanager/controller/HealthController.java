package com.imagemanager.controller;

import com.imagemanager.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        return ApiResponse.success("服务运行中", Map.of(
            "status", "UP",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
