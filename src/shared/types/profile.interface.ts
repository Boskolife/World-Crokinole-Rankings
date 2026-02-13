export type SubscriptionPlan = "standard" | "premium" | "administrator";

export interface IProfile {
    id: string;
    full_name: string | null;
    country: string | null;
    club: string | null;
    avatar_url: string | null;
    subscription_plan?: SubscriptionPlan;
    is_admin?: boolean;
    created_at?: string;
    updated_at?: string;
}



