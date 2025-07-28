import { Activity, Brain, Heart, Utensils } from "lucide-react"

export function Benefits() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How FDAi Helps You</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Our AI-powered platform reveals the hidden connections between what you consume and how you feel.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary/10 p-3">
              <Utensils className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Food Impacts</h3>
            <p className="text-center text-sm text-gray-500">
              Identify which foods trigger symptoms and which ones help you feel better.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary/10 p-3">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Symptom Tracking</h3>
            <p className="text-center text-sm text-gray-500">
              Monitor how your symptoms change based on your diet and medications.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary/10 p-3">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Medication Efficacy</h3>
            <p className="text-center text-sm text-gray-500">
              Understand how your medications interact with your diet and lifestyle.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary/10 p-3">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Personalized Insights</h3>
            <p className="text-center text-sm text-gray-500">
              Receive AI-powered recommendations tailored to your unique health profile.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
