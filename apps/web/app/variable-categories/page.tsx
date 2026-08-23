import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@repo/mysql-database'

export const metadata = {
  title: 'Variable Categories | DFDA',
  description: 'Browse all variable categories and explore tracked variables.',
}

// MySQL is optional for deployments that do not expose this route.
export const dynamic = 'force-dynamic'

async function getVariableCategories() {
  const categories = await prisma.variable_categories.findMany({
    where: {
      deleted_at: null,
      boring: false,
      is_public: true,
    },
    orderBy: [
      {
        number_of_variables: 'desc',
      },
    ],
  })

  return categories
}

export default async function VariableCategoriesPage() {
  if (!process.env.MYSQL_DATABASE_URL) notFound()

  const categories = await getVariableCategories()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Variable Categories</h1>
        <p className="text-xl text-gray-600">
          Browse {categories.length} categories of tracked variables
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          return (
            <Link
              key={category.id}
              href={`/variable-categories/${category.slug || category.id}`}
              className="block p-6 bg-white border-4 border-black rounded-lg hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="flex items-start gap-4">
                {category.image_url && (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-16 h-16 object-cover border-2 border-black rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black mb-2">{category.name}</h2>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {category.number_of_variables && (
                      <div className="px-2 py-1 bg-blue-100 border-2 border-black rounded">
                        <strong>Variables:</strong> {category.number_of_variables.toLocaleString()}
                      </div>
                    )}
                    {category.number_of_user_variables && (
                      <div className="px-2 py-1 bg-green-100 border-2 border-black rounded">
                        <strong>User Vars:</strong> {category.number_of_user_variables.toLocaleString()}
                      </div>
                    )}
                    {category.number_of_measurements && (
                      <div className="col-span-2 px-2 py-1 bg-yellow-100 border-2 border-black rounded">
                        <strong>Measurements:</strong> {category.number_of_measurements.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">No categories found</p>
        </div>
      )}
    </div>
  )
}
