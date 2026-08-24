import { Navigation } from "@/types"

import { dfdaLinks } from "./domains/dfda-nav"
import { dfdaNavigation } from "./domains/dfda-nav"
import { commonLinks } from "./shared-links"

export const generalNavigation = {
  dashboardTopNav: {
    data: [],
  } as Navigation,

  avatarNav: {
    data: [
      commonLinks.profileSettings,
      commonLinks.dashboard,
      dfdaLinks.dfda,
    ],
  } as Navigation,

  sidebarNav: {
    data: [
      commonLinks.dashboard,
      commonLinks.docs,
      commonLinks.contributeOnGithub,
      dfdaLinks.dfda,
    ],
  } as Navigation,
}
export const generalDashboardTopNav: Navigation = {
  data: [],
}
export const avatarNav = generalNavigation.avatarNav
export const generalFooterNav = dfdaNavigation.footerNav
export const generalSidebarNav = generalNavigation.sidebarNav
