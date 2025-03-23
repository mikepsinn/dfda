import Link from "next/link"
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function Contact() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Contact Us</h1>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                  <CardDescription>Have questions about FDA.gov v2? We're here to help.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First name</Label>
                        <Input id="first-name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last name</Label>
                        <Input id="last-name" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" className="min-h-[120px]" required />
                    </div>
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 rounded-full bg-primary/10 p-3">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Email</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <a href="mailto:info@fdav2.gov" className="hover:underline">
                          info@fdav2.gov
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 rounded-full bg-primary/10 p-3">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Phone</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <a href="tel:+18005551212" className="hover:underline">
                          1-800-555-1212
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 rounded-full bg-primary/10 p-3">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-medium">Address</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        10903 New Hampshire Ave
                        <br />
                        Silver Spring, MD 20993
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">How do I join a clinical trial?</h3>
                    <p className="text-sm text-muted-foreground">
                      You can browse available trials by visiting the "Find a Trial" page. After finding a trial that
                      matches your condition, you can follow the enrollment process outlined on the trial details page.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">How do I create a trial as a sponsor?</h3>
                    <p className="text-sm text-muted-foreground">
                      Sponsors can create trials by registering for an account and following the guided trial creation
                      process. Our platform streamlines insurance, participant recruitment, and data collection.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Is my health data secure?</h3>
                    <p className="text-sm text-muted-foreground">
                      Yes, we implement HIPAA-compliant security measures to protect all participant data. Your
                      information is encrypted and anonymized whenever possible.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">How are outcome labels created?</h3>
                    <p className="text-sm text-muted-foreground">
                      Outcome labels are created through a rigorous process that aggregates data from clinical trials,
                      real-world evidence, and systematic reviews. Each label undergoes expert review before
                      publication.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

