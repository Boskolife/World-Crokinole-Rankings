export const clientRoutes = {
    home: "/",
    events: "/events",
    clubs: "/clubs",
    membershipPlans: "/membership-plans",
    players: "/players",
    profile: "/profile",

    steps: (step: number) => `/new-visitor/step-${step}`,
};
