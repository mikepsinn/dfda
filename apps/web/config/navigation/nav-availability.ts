import type { NavItem } from "@/types"

interface NavigationAvailability {
  mysql: boolean
}

export function filterAvailableNavigationItems(
  items: NavItem[],
  availability: NavigationAvailability
) {
  return items.filter((item) => !item.requiresMySql || availability.mysql)
}
