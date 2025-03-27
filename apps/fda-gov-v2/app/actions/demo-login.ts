"use server"

import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

type UserType = "patient" | "doctor" | "sponsor"

export async function demoLogin(userType: UserType = "patient") {
  console.log('Starting demo login for user type:', userType);
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  // Demo account credentials based on user type
  const demoAccounts = {
    patient: {
      email: "demo-patient@dfda.earth",
      password: "demo-patient-password",
      data: {
        first_name: "Demo",
        last_name: "Patient",
        user_type: "patient",
      },
    },
    doctor: {
      email: "demo-doctor@dfda.earth",
      password: "demo-doctor-password",
      data: {
        first_name: "Demo",
        last_name: "Doctor",
        user_type: "doctor",
      },
    },
    sponsor: {
      email: "demo-sponsor@dfda.example.com",
      password: "demo-sponsor-password",
      data: {
        organization_name: "Demo Pharma",
        contact_name: "Demo Sponsor",
        user_type: "sponsor",
      },
    },
  }

  const account = demoAccounts[userType]

  try {
    console.log('Checking if demo account exists...');
    // Check if the demo account exists
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", account.email)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking for demo account:", checkError)
      throw new Error(`Failed to check for demo account: ${checkError.message}`)
    }

    if (!existingUser) {
      console.log('Creating new demo account...');
      // Create the demo account if it doesn't exist
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
      })

      if (signUpError) {
        console.error("Error creating demo account:", signUpError)
        throw new Error(`Failed to create demo account: ${signUpError.message}`)
      }

      // Create the profile
      if (authData?.user) {
        console.log('Creating demo profile...');
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: account.email,
          ...account.data,
        })

        if (profileError) {
          console.error("Error creating demo profile:", profileError)
          throw new Error(`Failed to create demo profile: ${profileError.message}`)
        }
      } else {
        throw new Error('No user data returned from auth signup')
      }
    }

    console.log('Signing in with demo account...');
    // Sign in with the demo account
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    if (signInError) {
      console.error("Error signing in with demo account:", signInError)
      throw new Error(`Failed to sign in with demo account: ${signInError.message}`)
    }

    if (!signInData?.user) {
      throw new Error('No user data returned from sign in')
    }

    console.log('Sign in successful, determining redirect URL...');
    // Return success with the appropriate redirect URL
    let redirectUrl = "/patient/dashboard"
    switch (userType) {
      case "doctor":
        redirectUrl = "/doctor/dashboard"
        break
      case "sponsor":
        redirectUrl = "/sponsor/dashboard"
        break
    }
    
    return { success: true, redirectUrl }
  } catch (error) {
    console.error("Demo login error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to log in with demo account" 
    }
  }
}

