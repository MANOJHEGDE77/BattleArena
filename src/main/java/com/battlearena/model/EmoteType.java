package com.battlearena.model;

/**
 * Tactical Emotes and Callouts available for real-time multiplayer communication.
 *
 * Layer: Domain / Model
 */
public enum EmoteType {
    TARGET_SPOTTED("TARGET_SPOTTED", "🎯", "Enemy Sighted!", "warning"),
    DEFEND_POS("DEFEND_POS", "🛡️", "Defend Here!", "tactical"),
    RUSH_ATTACK("RUSH_ATTACK", "⚡", "Charge Forward!", "aggressive"),
    DANGER_ALERT("DANGER_ALERT", "💥", "Danger Ahead!", "warning"),
    NEED_BACKUP("NEED_BACKUP", "🚨", "Need Backup!", "urgent"),
    TAUNT_FLEX("TAUNT_FLEX", "💀", "Can't Touch This!", "social"),
    CELEBRATE_GG("CELEBRATE_GG", "👑", "Good Game!", "social"),
    HEAL_REQUEST("HEAL_REQUEST", "❤️", "Need Repairs!", "urgent");

    private final String id;
    private final String icon;
    private final String label;
    private final String category;

    EmoteType(String id, String icon, String label, String category) {
        this.id = id;
        this.icon = icon;
        this.label = label;
        this.category = category;
    }

    public String getId() {
        return id;
    }

    public String getIcon() {
        return icon;
    }

    public String getLabel() {
        return label;
    }

    public String getCategory() {
        return category;
    }
}
