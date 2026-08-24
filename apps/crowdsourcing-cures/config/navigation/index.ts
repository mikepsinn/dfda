import { dfdaNavigation } from "./domains/dfda-nav"
import { DomainNavigation, NavigationConfig } from "./nav-types"

export const navigationConfig: NavigationConfig = {
  "dfda.earth": dfdaNavigation,
}

export function getNavigationForDomain(domain: string): DomainNavigation {
  return navigationConfig[domain] || navigationConfig["dfda.earth"]
}
