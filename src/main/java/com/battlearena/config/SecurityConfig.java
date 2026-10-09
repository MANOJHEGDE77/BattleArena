package com.battlearena.config;

import com.battlearena.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration bean definition.
 *
 * Layer: Configuration (Security Infrastructure Layer)
 * Responsibility: Sets up HTTP security rules, disables stateful sessions (enforcing stateless JWT),
 * registers BCrypt password encoder, and connects JwtAuthenticationFilter into the servlet chain.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public frontend assets & health check
                        .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/favicon.ico").permitAll()
                        .requestMatchers("/api/health").permitAll()
                        // Public auth registration and login endpoints
                        .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                        // Public leaderboard rankings
                        .requestMatchers("/api/leaderboard").permitAll()
                        // Public recent matches
                        .requestMatchers("/api/matches/recent").permitAll()
                        // Public room list for lobby discovery
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/rooms").permitAll()
                        // Public WebSocket handshake (authentication is handled within WebSocket handler via JWT)
                        .requestMatchers("/ws/**").permitAll()
                        // Protected endpoints (such as /api/auth/me, /api/matches/me) require a valid token
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\": \"Unauthorized\"}");
                        })
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
