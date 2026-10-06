package com.battlearena.repository;

import com.battlearena.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository interface for User persistence.
 *
 * Layer: Data Access Layer (Repository)
 * Responsibility: Executes SQL operations against MySQL via Hibernate ORM without manual JDBC boilerplate.
 *
 * Who calls it: UserService
 * What it calls: Spring Data JPA runtime proxies, generating SQL queries (e.g., SELECT ... FROM users WHERE username = ?)
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}
