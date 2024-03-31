export interface RoleReward {
    ID: number;
    guild: number;
    role: number;
    level: number;
    added_at: Date;
}

export interface LeaderboardPlayer {
    userID: bigint;
    xp: bigint;
}