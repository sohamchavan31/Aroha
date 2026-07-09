package com.aroha.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple fixed-window rate limiter for brute-force-sensitive endpoints
 * (login/register and AI calls). Keyed by client IP + path.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000;
    private static final int AUTH_LIMIT = 10;
    private static final int AI_LIMIT = 20;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();
        int limit;
        if (path.startsWith("/api/auth/")) {
            limit = AUTH_LIMIT;
        } else if (path.startsWith("/api/ai/")) {
            limit = AI_LIMIT;
        } else {
            chain.doFilter(request, response);
            return;
        }

        String key = clientIp(request) + ":" + path;
        long now = System.currentTimeMillis();
        Window window = windows.computeIfAbsent(key, k -> new Window(now));

        synchronized (window) {
            if (now - window.start > WINDOW_MILLIS) {
                window.start = now;
                window.count.set(0);
            }
            if (window.count.incrementAndGet() > limit) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too many requests, please try again later.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class Window {
        volatile long start;
        final AtomicInteger count = new AtomicInteger(0);

        Window(long start) {
            this.start = start;
        }
    }
}
