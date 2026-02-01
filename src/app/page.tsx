import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Transform Your Home
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Professional renovation services in Stratford, Ontario. From kitchens
          to bathrooms to whole-home transformations.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg" className="h-12 px-6">
            <Link href="/estimate">Get a Quote</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-6">
            <Link href="/visualizer">Visualize Your Project</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
