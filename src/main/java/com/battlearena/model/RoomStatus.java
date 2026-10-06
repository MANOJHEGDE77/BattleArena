package com.battlearena.model;

/**
 * State lifecycle enum for a game room.
 *
 * WAITING:  Room is open for players to join and set readiness.
 * PLAYING:  Game has started, simulation / loop is active.
 * FINISHED: Match ended, final scores logged.
 */
public enum RoomStatus {
    WAITING,
    PLAYING,
    FINISHED
}
