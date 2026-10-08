package com.battlearena.exception;

/**
 * Exception thrown when a requested resource (e.g. User, Room) cannot be found.
 *
 * Layer: Domain / Exception
 * Responsibility: Signals missing entity lookups to be caught by GlobalExceptionHandler
 * and mapped to HTTP 404 NOT_FOUND.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
