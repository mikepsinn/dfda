// Define a type for our redirects
type Redirect = {
  source: string
  destination: string
  permanent?: boolean
}

export const redirects: Redirect[] = [
  {
    source: "/dfda/right-to-trial",
    destination: "/dfda/disease-eradication-act",
    permanent: true, // 308 redirect
  },
  {
    source: "/community",
    destination: "https://github.com/orgs/decentralized-fda/discussions",
    permanent: true, // 308 redirect
  },
  // Add more redirects here as needed
] 