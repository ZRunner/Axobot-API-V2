export interface DBRawUserData {
    user_id: bigint;
    username: string;
    global_name: string;
    avatar_hash: string | null;
    is_bot: boolean;
}