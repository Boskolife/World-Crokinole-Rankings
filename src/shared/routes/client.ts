export const clientRoutes = {
    home: "/",
    events: "/events",
    clubs: "/clubs",
    membershipPlans: "/membership-plans",
    players: "/players",

    steps: (step: number) => `/new-visitor/step-${step}`,
};
