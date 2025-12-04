"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { openTawkChat } from "@/components/tawk-widget"
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  Search,
  Send,
  Loader2,
  CheckCircle,
  BookOpen,
  Utensils,
  Activity,
  Calendar,
  Settings,
  User,
} from "lucide-react"

export default function SupportPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketMessage, setTicketMessage] = useState("")
  const [ticketCategory, setTicketCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ticketSubmitted, setTicketSubmitted] = useState(false)

  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session?.user?.id) {
          router.push("/login")
          return
        }

        setUserId(data.session.user.id)
      } catch (err) {
        console.error("[v0] Error:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    getUserId()
  }, [router])

  const faqs = [
    {
      category: "Getting Started",
      icon: <BookOpen className="h-4 w-4" />,
      questions: [
        {
          q: "How do I set up my profile?",
          a: "Go to Profile in the sidebar, then fill in your personal information, health goals, and dietary preferences. This helps us personalize your meal plans and recommendations.",
        },
        {
          q: "How accurate are the calorie calculations?",
          a: "Our calorie calculations use the Mifflin-St Jeor equation for BMR and factor in your activity level for TDEE. These are scientifically validated formulas that provide accurate estimates for most people.",
        },
        {
          q: "Can I change my health goals later?",
          a: "Yes! You can update your health goals anytime from the Profile section. Your meal plans and recommendations will automatically adjust based on your new goals.",
        },
      ],
    },
    {
      category: "Meal Plans",
      icon: <Utensils className="h-4 w-4" />,
      questions: [
        {
          q: "How do I generate a meal plan?",
          a: "Go to Meal Plans, click 'Generate New Plan', customize your preferences (calories, macros, meals per day), and click Generate. Our system will create a personalized weekly meal plan for you.",
        },
        {
          q: "Can I customize my meal plan?",
          a: "After generating a plan, you can swap individual meals, adjust portions, or regenerate specific days. Your dietary preferences and restrictions are always respected.",
        },
        {
          q: "How do I add my own recipes?",
          a: "Currently, you can bookmark recipes from our library. Custom recipe uploads are coming soon in a future update.",
        },
      ],
    },
    {
      category: "Nutrition Tracking",
      icon: <Activity className="h-4 w-4" />,
      questions: [
        {
          q: "How do I log my meals?",
          a: "Go to Nutrition Tracking, click 'Log Food', search for your food item, select the portion size, and save. You can also quick-add foods from your meal plan.",
        },
        {
          q: "What if I can't find a food item?",
          a: "Try searching with different terms or use the manual entry option to input custom nutrition values. Our food database contains over 100,000 items.",
        },
        {
          q: "How do I track water intake?",
          a: "On the Nutrition Tracking page, use the Water Intake widget to log cups of water throughout the day. You can also set reminders in Settings.",
        },
      ],
    },
    {
      category: "Consultations",
      icon: <Calendar className="h-4 w-4" />,
      questions: [
        {
          q: "How do I book a consultation?",
          a: "Go to Consultations, browse available nutritionists, select one that fits your needs, choose an available time slot, and confirm your booking.",
        },
        {
          q: "Can I reschedule a consultation?",
          a: "Yes, go to your upcoming consultations and click 'Reschedule'. Please do this at least 24 hours before your appointment.",
        },
        {
          q: "What happens during a consultation?",
          a: "Your nutritionist will review your profile, discuss your goals, answer questions, and provide personalized advice. Sessions typically last 30-60 minutes.",
        },
      ],
    },
    {
      category: "Account & Settings",
      icon: <Settings className="h-4 w-4" />,
      questions: [
        {
          q: "How do I change my password?",
          a: "Go to Settings > General, scroll to the Password section, enter your current password and new password, then click 'Change Password'.",
        },
        {
          q: "How do I delete my account?",
          a: "Go to Settings > Privacy and click 'Delete Account'. This action is permanent and will remove all your data. Please export any data you want to keep first.",
        },
        {
          q: "How do I export my data?",
          a: "Go to Profile > Account tab and click 'Export Data'. You can download your meal logs, progress data, and saved recipes in CSV format.",
        },
      ],
    },
  ]

  const filteredFaqs = searchQuery
    ? faqs
        .map((category) => ({
          ...category,
          questions: category.questions.filter(
            (q) =>
              q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              q.a.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((category) => category.questions.length > 0)
    : faqs

  const handleSubmitTicket = async () => {
    if (!ticketSubject || !ticketMessage || !ticketCategory) return

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setTicketSubmitted(true)
    setTicketSubject("")
    setTicketMessage("")
    setTicketCategory("")
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Help & Support" text="Find answers to your questions or contact our support team.">
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          View Documentation
        </Button>
      </DashboardHeader>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredFaqs.length > 0 ? (
                <div className="space-y-6">
                  {filteredFaqs.map((category) => (
                    <div key={category.category}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">{category.icon}</div>
                        <h3 className="font-semibold">{category.category}</h3>
                      </div>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((item, index) => (
                          <AccordionItem key={index} value={`${category.category}-${index}`}>
                            <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No FAQs found matching your search.</p>
                  <p className="text-sm mt-2">Try different keywords or contact support.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Live Chat</CardTitle>
                <CardDescription>Chat with our support team</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Available 24/7 with Tawk.to</p>
                <Button className="w-full" onClick={openTawkChat}>
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Email Support</CardTitle>
                <CardDescription>Get help via email</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Response within 24 hours</p>
                <Button variant="outline" className="w-full bg-transparent">
                  support@fittrack.com
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Phone Support</CardTitle>
                <CardDescription>Talk to a representative</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Premium subscribers only</p>
                <Button variant="outline" className="w-full bg-transparent">
                  1-800-FIT-HELP
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>Describe your issue and we'll get back to you as soon as possible</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticketSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ticket Submitted!</h3>
                  <p className="text-muted-foreground mb-4">
                    We've received your support request and will respond within 24 hours.
                  </p>
                  <Button onClick={() => setTicketSubmitted(false)}>Submit Another Ticket</Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={ticketCategory} onValueChange={setTicketCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="account">Account Issues</SelectItem>
                          <SelectItem value="billing">Billing & Subscription</SelectItem>
                          <SelectItem value="technical">Technical Problems</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="meal-plans">Meal Plans</SelectItem>
                          <SelectItem value="consultations">Consultations</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Please describe your issue in detail..."
                      rows={6}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitTicket}
                    disabled={!ticketSubject || !ticketMessage || !ticketCategory || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>Learn how to use FitTrack effectively</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: "Getting Started with FitTrack", duration: "5:32" },
                  { title: "Creating Your First Meal Plan", duration: "8:15" },
                  { title: "Tracking Nutrition Like a Pro", duration: "6:48" },
                  { title: "Understanding Your Health Metrics", duration: "7:22" },
                  { title: "Booking Consultations", duration: "4:10" },
                ].map((video, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{video.title}</span>
                    </div>
                    <Badge variant="outline">{video.duration}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Detailed guides and references</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: "User Guide", pages: "45 pages" },
                  { title: "Nutrition Basics", pages: "28 pages" },
                  { title: "Meal Planning Guide", pages: "32 pages" },
                  { title: "API Documentation", pages: "Technical" },
                  { title: "Privacy Policy", pages: "Legal" },
                ].map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{doc.title}</span>
                    </div>
                    <Badge variant="secondary">{doc.pages}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Community Resources</CardTitle>
              <CardDescription>Connect with other FitTrack users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg border text-center">
                  <User className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Community Forum</h4>
                  <p className="text-sm text-muted-foreground mt-1">Share tips and get advice from other users</p>
                  <Button variant="link" className="mt-2">
                    Visit Forum
                  </Button>
                </div>
                <div className="p-4 rounded-lg border text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Discord Server</h4>
                  <p className="text-sm text-muted-foreground mt-1">Join our active community chat</p>
                  <Button variant="link" className="mt-2">
                    Join Discord
                  </Button>
                </div>
                <div className="p-4 rounded-lg border text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Blog</h4>
                  <p className="text-sm text-muted-foreground mt-1">Nutrition tips and success stories</p>
                  <Button variant="link" className="mt-2">
                    Read Blog
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
