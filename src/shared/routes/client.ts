export const clientRoutes = {
    home: "/",
    events: "/events",
    clubs: "/clubs",
    membershipPlans: "/membership-plans",

    steps: (step: number) => `/new-visitor/step-${step}`,
};
