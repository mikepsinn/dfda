import { routeTree } from '@/config/routeTree'
import Link from 'next/link'

// Dashboard sections based on main route categories
const dashboardSections = [
  {
    title: 'Clinical Research',
    items: [
      routeTree.children.trials,
      routeTree.children.study,
      routeTree.children.researcher,
    ]
  },
  {
    title: 'Health Data',
    items: [
      routeTree.children.measurements,
      routeTree.children.userVariables,
      routeTree.children.globalVariables,
    ]
  },
  {
    title: 'Medical Resources',
    items: [
      routeTree.children.conditions,
      routeTree.children.treatments,
      routeTree.children.articles,
    ]
  }
]

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <div className="neobrutalist-gradient-container neobrutalist-gradient-pink text-white mb-12">
        <h1 className="neobrutalist-hero-title">Dashboard</h1>
        <p className="neobrutalist-description">
          Welcome to your decentralized FDA control center
        </p>
      </div>

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardSections.map((section) => (
          <div key={section.title} className="neobrutalist-container">
            <h2 className="neobrutalist-title text-2xl">{section.title}</h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className="group neobrutalist-button w-full flex justify-between items-center"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <span>{item.displayName}</span>
                  </span>
                  <span className="text-xl">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="neobrutalist-gradient-container neobrutalist-gradient-green text-white">
        <h2 className="neobrutalist-title text-2xl">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link href={`${routeTree.children.study.path}/create`} className="group neobrutalist-button text-black">
            <span className="text-2xl">➕</span>
            <span>New Study</span>
          </Link>
          <Link href={`${routeTree.children.trials.path}/search`} className="group neobrutalist-button text-black">
            <span className="text-2xl">🔍</span>
            <span>Search Trials</span>
          </Link>
          <Link href={routeTree.children.import.path} className="group neobrutalist-button text-black">
            <span className="text-2xl">⬆️</span>
            <span>Import Data</span>
          </Link>
        </div>
      </div>

      {/* Inbox Preview */}
      <div className="neobrutalist-container">
        <div className="flex justify-between items-center mb-4">
          <h2 className="neobrutalist-title text-2xl">Recent Messages</h2>
          <Link href={routeTree.children.inbox.path} className="group neobrutalist-button">
            <span className="text-2xl">📥</span>
            <span>View All</span>
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="neobrutalist-description text-gray-500">
            No new messages
          </p>
        </div>
      </div>
    </div>
  )
}
