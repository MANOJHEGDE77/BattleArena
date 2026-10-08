package com.battlearena.model;

/**
 * Model representing a real-time in-game chat or system announcement message.
 *
 * Layer: Domain / Model
 */
public class ChatMessage {

    private final String id;
    private final String username;
    private final String text;
    private final long timestamp;
    private final boolean system;

    public ChatMessage(String id, String username, String text, long timestamp, boolean system) {
        this.id = id;
        this.username = username;
        this.text = text;
        this.timestamp = timestamp;
        this.system = system;
    }

    public String getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getText() {
        return text;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public boolean isSystem() {
        return system;
    }
}
