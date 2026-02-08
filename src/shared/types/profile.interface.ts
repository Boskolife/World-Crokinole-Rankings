export type SubscriptionPlan = "standard" | "premium" | "administrator";

export interface IProfile {
    id: string;
    full_name: string | null;
    country: string | null;
    club: string | null;
    subscription_plan?: SubscriptionPlan;
    created_at?: string;
    updated_at?: string;
}



