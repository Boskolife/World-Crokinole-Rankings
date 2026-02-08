export const clientRoutes = {
    home: "/",
    events: "/events",
    clubs: "/clubs",
    membershipPlans: "/membership-plans",
    players: "/players",
    profile: "/profile",
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
    admin: "/admin",

    steps: (step: number) => `/new-visitor/step-${step}`,
};
