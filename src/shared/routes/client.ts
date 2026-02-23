export const clientRoutes = {
    home: "/",
    events: "/events",
    rankings: "/rankings",
    clubs: "/clubs",
    membershipPlans: "/membership-plans",
    players: "/players",
    profile: "/profile",
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
    admin: "/admin",
    dashboard: "/dashboard",

    steps: (step: number) => `/new-visitor/step-${step}`,
    eventDetail: (id: number) => `/events/${id}`,
};
