export interface RoleReward {
    ID: bigint;
    guild: bigint;
    role: bigint;
    level: bigint;
    added_at: Date;
}

export interface LeaderboardPlayer {
    userID: bigint;
    xp: bigint;
}