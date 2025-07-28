"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Plus,
  MessageSquare,
  History,
  Settings,
  User,
  LogOut,
  Heart,
  Apple,
  Pill,
  Moon,
  Sun,
  Bug,
  Database,
  Shield,
  Target,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { Separator } from "@/components/ui/separator"
import { ApiTester } from "@/components/debug/api-tester"
import { OpenAILogViewer } from "@/components/debug/openai-log-viewer"

export function AppSidebar() {
  const { user, isGuest, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [conversations, setConversations] = useState([
    { id: "1", title: "My Health Journey", active: true },
    { id: "2", title: "Food Sensitivity Analysis", active: false },
    { id: "3", title: "Medication Effectiveness", active: false },
  ])

  const [showApiTester, setShowApiTester] = useState(false)
  const [showOpenAILogs, setShowOpenAILogs] = useState(false)

  const startNewChat = () => {
    const newConversations = conversations.map((conv) => ({ ...conv, active: false }))
    newConversations.unshift({ id: Date.now().toString(), title: "New Conversation", active: true })
    setConversations(newConversations)
  }

  const selectConversation = (id: string) => {
    setConversations(
      conversations.map((conv) => ({
        ...conv,
        active: conv.id === id,
      })),
    )
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (isGuest) return "G"
    if (!user) return "U"

    const email = user.email || ""
    if (!email) return "U"

    return email.charAt(0).toUpperCase()
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <>
      <Sidebar className="dark:border-gray-800">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Button
                variant="outline"
                className="w-full justify-start dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                onClick={startNewChat}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Conversation
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="dark:text-gray-400">Recent Conversations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      isActive={conversation.active}
                      onClick={() => selectConversation(conversation.id)}
                      className={conversation.active ? "dark:bg-gray-700" : "dark:hover:bg-gray-800"}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>{conversation.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="dark:text-gray-400">Health Tracking</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="dark:hover:bg-gray-800">
                    <a href="/goals">
                      <Target className="mr-2 h-4 w-4" />
                      <span>Goals</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="dark:hover:bg-gray-800">
                    <Heart className="mr-2 h-4 w-4" />
                    <span>Symptoms</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="dark:hover:bg-gray-800">
                    <Apple className="mr-2 h-4 w-4" />
                    <span>Diet</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="dark:hover:bg-gray-800">
                    <Pill className="mr-2 h-4 w-4" />
                    <span>Medications</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="dark:text-gray-400">Developer Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {process.env.NODE_ENV === "development" && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className="dark:hover:bg-gray-800"
                        onClick={() => (window.location.href = "/admin")}
                      >
                        <Shield className="mr-2 h-4 w-4 text-yellow-500" />
                        <span>Admin Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton className="dark:hover:bg-gray-800" onClick={() => setShowApiTester(true)}>
                        <Bug className="mr-2 h-4 w-4 text-purple-500" />
                        <span>API Tester</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton className="dark:hover:bg-gray-800" onClick={() => setShowOpenAILogs(true)}>
                        <Database className="mr-2 h-4 w-4 text-green-500" />
                        <span>OpenAI Logs</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="dark:hover:bg-gray-800">
                <History className="mr-2 h-4 w-4" />
                <span>History</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="dark:hover:bg-gray-800">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="dark:hover:bg-gray-800">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleTheme} className="dark:hover:bg-gray-800">
                {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <Separator className="my-2 dark:bg-gray-800" />
            <SidebarMenuItem>
              <div className="flex items-center justify-between w-full px-3 py-2">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="dark:bg-gray-700">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate max-w-[120px]">
                    {isGuest ? "Guest User" : user?.email || "User"}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 dark:hover:bg-gray-800">
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign Out</span>
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Debug components */}
      {showApiTester && <ApiTester onClose={() => setShowApiTester(false)} />}
      {showOpenAILogs && <OpenAILogViewer onClose={() => setShowOpenAILogs(false)} />}
    </>
  )
}
