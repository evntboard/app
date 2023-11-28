export type SiteConfig = typeof siteConfig

export const siteConfig = {
    name: "EvntBoard",
    description: "Your next automation tool",
    mainNav: [
        {
            title: "Home",
            href: "/",
        },
        {
            title: "Organizations",
            href: "/organizations",
        },
    ],
    links: {
        twitter: "https://twitter.com/evntboard",
        github: "https://github.com/evntboard/cloud",
        docs: "https://docs.evntboard.io",
    },
}