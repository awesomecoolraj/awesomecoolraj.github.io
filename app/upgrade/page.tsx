import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from 'next/link'

export default function Upgrade() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-900 via-purple-900 to-black">
      <Card className="w-full max-w-4xl bg-black/30 backdrop-blur-md border-none shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center gradient-light bg-clip-text text-transparent">Upgrade to Pro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Get More Features for Just $9.99/year</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access to advanced AI models</li>
            <li>Unlimited scraping requests</li>
            <li>Priority support</li>
            <li>Advanced analytics</li>
          </ul>
          <Button className="w-full" variant="gradient">
            Subscribe Now
          </Button>
          <Link href="/" passHref>
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}