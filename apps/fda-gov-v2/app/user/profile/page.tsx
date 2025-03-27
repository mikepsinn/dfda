"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Shield, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function UserProfile() {
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Mock user data
  const userData = {
    type: "patient", // or "sponsor"
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Anytown, CA 94123",
    dateJoined: "December 10, 2024",
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setUpdateSuccess(true)

    // Hide success message after 3 seconds
    setTimeout(() => {
      setUpdateSuccess(false)
    }, 3000)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-2">
              <Link
                href={userData.type === "patient" ? "/patient/dashboard" : "/sponsor/dashboard"}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to dashboard</span>
              </Link>
              <h1 className="text-2xl font-bold">Account Settings</h1>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="payment">Payment Methods</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details and contact information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {updateSuccess && (
                      <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-700 flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        <span>Your profile has been updated successfully</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={userData.name} />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" defaultValue={userData.email} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" defaultValue={userData.phone} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" defaultValue={userData.address} />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit">Save Changes</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>View your account details and membership information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Account Type</div>
                          <div className="font-medium">{userData.type === "patient" ? "Patient" : "Trial Sponsor"}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Member Since</div>
                          <div className="font-medium">{userData.dateJoined}</div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Account Status</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password to keep your account secure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit">Update Password</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>Add an extra layer of security to your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Shield className="h-10 w-10 text-primary" />
                      <div className="space-y-2">
                        <h3 className="font-medium">Protect your account</h3>
                        <p className="text-sm text-muted-foreground">
                          Two-factor authentication adds an extra layer of security to your account by requiring more
                          than just a password to sign in.
                        </p>
                        <Button variant="outline">Enable 2FA</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>Manage how your data is used and shared</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Email Notifications</div>
                          <div className="text-sm text-muted-foreground">
                            Receive email updates about your trial participation
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="email-notifications" className="sr-only">
                            Toggle email notifications
                          </Label>
                          <input
                            type="checkbox"
                            id="email-notifications"
                            className="h-4 w-4 rounded border-gray-300"
                            defaultChecked
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Data Sharing</div>
                          <div className="text-sm text-muted-foreground">
                            Allow anonymized data to be used for research purposes
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="data-sharing" className="sr-only">
                            Toggle data sharing
                          </Label>
                          <input
                            type="checkbox"
                            id="data-sharing"
                            className="h-4 w-4 rounded border-gray-300"
                            defaultChecked
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Save Privacy Settings
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Manage your payment methods and billing information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">Visa ending in 4242</div>
                              <div className="text-sm text-muted-foreground">Expires 12/2026</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm">
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Add Payment Method
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>View your past transactions and payment history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Trial Deposit Refund</div>
                            <div className="text-sm text-muted-foreground">March 15, 2025</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">+$25.00</div>
                            <div className="text-xs text-muted-foreground">Refund</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Trial Deposit</div>
                            <div className="text-sm text-muted-foreground">February 15, 2025</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">-$100.00</div>
                            <div className="text-xs text-muted-foreground">Payment</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View All Transactions
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

