package com.battlearena.service;

import com.battlearena.dto.AuthRequest;
import com.battlearena.dto.AuthResponse;
import com.battlearena.dto.UserProfileResponse;
import com.battlearena.exception.ResourceNotFoundException;
import com.battlearena.model.User;
import com.battlearena.repository.UserRepository;
import com.battlearena.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service orchestrating user authentication, credentials hashing, and MySQL persistence.
 *
 * Layer: Service (Business Logic Layer)
 * Responsibility: Enforces business validation rules (unique username, password length),
 * invokes BCrypt password encoder, interacts with UserRepository for database queries,
 * and calls JwtUtil to create authentication tokens.
 *
 * Who calls it: AuthController
 * What it calls: UserRepository, PasswordEncoder, JwtUtil
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Registers a new user account with BCrypt encrypted password.
     */
    @Transactional
    public AuthResponse register(AuthRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters long");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }

        String username = request.getUsername().trim();

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username '" + username + "' is already taken");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(username, hashedPassword);
        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getUsername(), savedUser.getId());
        return new AuthResponse(token, savedUser.getUsername(), savedUser.getId(), savedUser.getHighestScore(), "Registration successful");
    }

    /**
     * Authenticates an existing user and returns a signed JWT token.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Username and password are required");
        }

        String username = request.getUsername().trim();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        return new AuthResponse(token, user.getUsername(), user.getId(), user.getHighestScore(), "Login successful");
    }

    /**
     * Retrieves the profile and gameplay statistics of an authenticated user.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getTotalGames(),
                user.getTotalScore(),
                user.getHighestScore(),
                user.getCreatedAt()
        );
    }

    /**
     * Retrieves the top 10 players globally ranked by career highest score.
     */
    @Transactional(readOnly = true)
    public java.util.List<com.battlearena.dto.LeaderboardEntryDTO> getLeaderboard() {
        java.util.List<User> topUsers = userRepository.findTop10ByOrderByHighestScoreDescTotalScoreDesc();
        java.util.concurrent.atomic.AtomicInteger rankCounter = new java.util.concurrent.atomic.AtomicInteger(1);

        return topUsers.stream()
                .map(u -> new com.battlearena.dto.LeaderboardEntryDTO(
                        rankCounter.getAndIncrement(),
                        u.getUsername(),
                        u.getHighestScore(),
                        u.getTotalScore(),
                        u.getTotalGames()
                ))
                .toList();
    }

    /**
     * Persists match results and updates career high score upon game completion.
     */
    @Transactional
    public void recordMatchResult(String username, int matchScore) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setTotalGames(user.getTotalGames() + 1);
            user.setTotalScore(user.getTotalScore() + matchScore);
            if (matchScore > user.getHighestScore()) {
                user.setHighestScore(matchScore);
            }
            userRepository.save(user);
        });
    }
}
