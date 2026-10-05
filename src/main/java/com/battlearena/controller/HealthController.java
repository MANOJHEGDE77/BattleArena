package com.battlearena.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * HealthController provides a lightweight status check for the service.
 *
 * Layer: Controller (Presentation / API Layer)
 * Responsibility: Handles incoming HTTP requests, maps them to handler methods,
 * and serializes return values into HTTP response bodies.
 *
 * Who calls it: Spring MVC DispatcherServlet upon receiving matching HTTP requests.
 * What it calls: Java standard libraries (and in later phases, Service Layer).
 * Data flow: HTTP GET /api/health -> DispatcherServlet -> HealthController -> JSON response.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, Object> checkHealth() {
        return Map.of(
                "status", "UP",
                "game", "Battle Arena",
                "timestamp", Instant.now().toString()
        );
    }
}
