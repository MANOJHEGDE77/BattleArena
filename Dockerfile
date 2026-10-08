# ==============================================================================
# Multi-Stage Production Dockerfile for Cyber Battle Arena
# Target: Java 21 / Spring Boot 3.2.x Authoritative Game Server
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency Cache & Compilation Builder
# ------------------------------------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Pre-fetch dependencies to leverage Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy project source tree and build executable JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Minimal Hardened JRE 21 Runtime Environment
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install curl for container health check probes
RUN apk add --no-cache curl

# Security: Create non-root application user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled executable JAR from builder stage
COPY --from=builder /build/target/*.jar /app/battle-arena.jar

# Enforce strict ownership
RUN chown -R appuser:appgroup /app

# Switch to unprivileged execution user
USER appuser

# Expose default HTTP / WebSocket networking port
EXPOSE 8080

# Environment defaults for cloud portability
ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Container liveness & readiness healthcheck probe
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Launch game server with dynamic port binding support
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=$PORT -jar /app/battle-arena.jar"]
