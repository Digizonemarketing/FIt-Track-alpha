"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowRight,
  CheckCircle,
  Utensils,
  BarChart3,
  Calendar,
  MessageCircle,
  Brain,
  Heart,
  Zap,
  Smartphone,
  Sparkles,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`sticky top-0 z-50 w-full border-b backdrop-blur transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 supports-[backdrop-filter]:bg-background/60"
            : "bg-transparent border-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FitTrack</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Testimonials
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="h-10 w-10"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {user.user_metadata?.first_name?.charAt(0) || user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/recipes">Browse Recipes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/recipes">Saved Recipes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium hover:text-primary transition-colors hidden sm:inline"
                >
                  Log in
                </Link>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute top-1/4 -left-20 h-60 w-60 rounded-full bg-secondary/10 blur-3xl" />
            <motion.div
              className="absolute bottom-1/3 right-1/4 h-40 w-40 rounded-full bg-accent/10 blur-3xl"
              animate={{
                y: [0, 30, 0],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.div
                  className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Powered by AI Technology
                </motion.div>
                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight text-balance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Your Personal <span className="text-primary">AI Nutritionist</span> & Meal Planner
                </motion.h1>
                <motion.p
                  className="text-xl text-muted-foreground mb-8 text-pretty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  Transform your health with personalized meal plans, advanced nutrition tracking, AI-powered
                  consultations, and workout integration. Track calories, macros, and progress all in one platform.
                </motion.p>
                <motion.div
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <Button size="lg" className="h-14 px-8 text-base" asChild>
                    <Link href="/register">
                      Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base bg-transparent" asChild>
                    <Link href="#how-it-works">See How It Works</Link>
                  </Button>
                </motion.div>

                <motion.div
                  className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-background overflow-hidden">
                        <Image
                          src={`/user.jpg?height=40&width=40&text=User${i}`}
                          alt={`User ${i}`}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">50,000+</span> active users
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="h-4 w-4 fill-primary" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                    <span className="text-sm font-medium ml-1">4.9/5</span>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                className="relative max-w-2xl mx-auto lg:mx-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <div className="relative z-10 bg-card rounded-2xl shadow-2xl overflow-hidden border">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
                  <div className="p-1">
                    <div className="rounded-xl overflow-hidden">
                      <Image
                        src="/Your-Personal-A-Nutritionist-Meal-Planner.webp?height=600&width=800&text=Dashboard+Preview"
                        alt="FitTrack Dashboard Preview"
                        width={800}
                        height={600}
                        className="w-full"
                        priority
                      />
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  className="absolute -top-6 -left-6 bg-card rounded-lg shadow-lg p-3 z-20 border"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Meal Plan Ready</div>
                      <div className="text-xs text-muted-foreground">Personalized for you</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-6 -right-6 bg-card rounded-lg shadow-lg p-3 z-20 border"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Progress Tracking</div>
                      <div className="text-xs text-muted-foreground">15% to your goal</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
            >
              <Link
                href="#features"
                className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="text-xs mb-2">Scroll to explore</span>
                <ChevronDown className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <StatsSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* Advanced Features Section */}
        <AdvancedFeaturesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* AI Technology Section */}
        <AITechnologySection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Section */}
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} className="py-12 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "50K+", label: "Active Users", delay: 0 },
            { value: "1M+", label: "Meals Generated", delay: 0.1 },
            { value: "95%", label: "Success Rate", delay: 0.2 },
            { value: "4.8/5", label: "User Rating", delay: 0.3 },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: stat.delay }}
            >
              <motion.div
                className="text-3xl font-bold text-primary mb-2"
                initial={{ scale: 0.8 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ duration: 0.4, delay: stat.delay + 0.2 }}
              >
                {stat.value}
              </motion.div>
              <p className="text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  const features = [
    {
      icon: <Utensils className="h-10 w-10 text-primary" />,
      title: "AI Meal Planning",
      description:
        "Get personalized meal plans powered by AI that adapt to your fitness goals, preferences, allergies, and dietary restrictions in seconds.",
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-primary" />,
      title: "Nutrition Tracking",
      description:
        "Track calories, protein, carbs, and fats with our visual dashboard. Get real-time insights into your macronutrient balance and trending patterns.",
    },
    {
      icon: <Calendar className="h-10 w-10 text-primary" />,
      title: "Meal Calendar",
      description:
        "Plan your meals weekly with our intuitive meal calendar. Drag and drop meals, adjust portions, and get smart shopping lists automatically generated.",
    },
    {
      icon: <MessageCircle className="h-10 w-10 text-primary" />,
      title: "Expert AI Consultations",
      description:
        "Chat with our AI nutritionist for personalized advice. Reference your meal and workout plans directly in conversations for context-aware recommendations.",
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-primary" />,
      title: "Progress Tracking",
      description:
        "Monitor weight changes, body measurements, and goal progress with beautiful charts. Celebrate milestones and adjust plans based on real data.",
    },
    {
      icon: <Brain className="h-10 w-10 text-primary" />,
      title: "Smart Recommendations",
      description:
        "AI learns from your behavior and preferences to suggest meals and adjustments that help you stay consistent and reach your goals faster.",
    },
    {
      icon: <Heart className="h-10 w-10 text-primary" />,
      title: "Health Metrics",
      description:
        "Calculate and track BMI, BMR, TDEE, and macronutrient targets. Get advanced body composition analysis tailored to your fitness goals.",
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Workout Integration",
      description:
        "Connect your fitness data to see how workouts impact your nutrition goals. Adjust calorie targets based on actual activity levels.",
    },
    {
      icon: <Smartphone className="h-10 w-10 text-primary" />,
      title: "Mobile & Web",
      description:
        "Access FitTrack seamlessly across web and mobile. Your plans, progress, and consultations sync automatically across all devices.",
    },
  ]

  return (
    <section id="features" ref={ref} className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          className="text-center mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">Features</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Powerful Features to Transform Your Diet</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Everything you need to plan, track, and achieve your nutrition goals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-all duration-300 hover:translate-y-[-5px]"
            >
              <motion.div
                className="mb-4"
                initial={{ scale: 0.8 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.1 * index + 0.2 }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-pretty">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AdvancedFeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} className="py-20 bg-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
              Advanced Features
            </div>
            <h2 className="text-3xl font-bold mb-6 text-balance">Advanced Health Metrics & Analytics</h2>
            <p className="text-lg text-muted-foreground mb-6 text-pretty">
              FitTrack combines AI technology with advanced nutrition science. Track beyond basic calories with
              personalized body composition analysis, metabolic rate calculations, and data-driven macronutrient
              optimization for your specific fitness goal.
            </p>
            <ul className="space-y-4">
              {[
                {
                  title: "BMI Tracking & Body Composition",
                  description:
                    "Monitor your Body Mass Index and track body composition changes over time with visual progress charts.",
                },
                {
                  title: "BMR & TDEE Calculations",
                  description:
                    "Know your Basal Metabolic Rate and Total Daily Energy Expenditure based on your age, weight, height, and activity level.",
                },
                {
                  title: "Personalized Macro Targets",
                  description:
                    "Get AI-calculated protein, carb, and fat targets based on your fitness goal - whether it's weight loss, muscle gain, or maintenance.",
                },
                {
                  title: "Nutrition Analytics Dashboard",
                  description:
                    "Visual charts showing your weekly intake patterns, macro ratios, trending improvements, and goal achievement percentage.",
                },
              ].map((item, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 * index + 0.3 }}
                >
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{item.title}</span>
                    <p className="text-muted-foreground text-pretty">{item.description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="rounded-xl overflow-hidden border shadow-lg"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <Image
                src="Advanced-Health-Metrics-and-Analytics.webp?height=600&width=600&text=Health+Metrics+Dashboard"
                alt="Health Metrics Dashboard"
                width={600}
                height={600}
                className="w-full"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.6 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const steps = [
    {
      number: "1",
      title: "Create Your Profile",
      description: "Tell us about your goals, preferences, and dietary restrictions.",
      image: "/create-profile.jpg?height=200&width=300&text=Create+Profile",
    },
    {
      number: "2",
      title: "Get Your Meal Plan",
      description: "Our AI generates a personalized meal plan tailored to your needs.",
      image: "/get-meal-plan.jpg?height=200&width=300&text=Meal+Plan+Generation",
    },
    {
      number: "3",
      title: "Track & Improve",
      description: "Track your progress, adjust your plan, and reach your goals.",
      image: "/Track.jpg?height=200&width=300&text=Progress+Tracking",
    },
  ]

  return (
    <section id="how-it-works" ref={ref} className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          className="text-center mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">Process</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">How FitTrack Works</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Three simple steps to transform your nutrition and reach your goals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="bg-card rounded-lg p-6 shadow-sm border relative"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 * index }}
            >
              <motion.div
                className="absolute -top-5 -left-5 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                initial={{ scale: 0.5 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                  delay: 0.2 * index + 0.3,
                }}
              >
                {step.number}
              </motion.div>
              <h3 className="text-xl font-semibold mb-2 mt-4">{step.title}</h3>
              <p className="text-muted-foreground mb-4 text-pretty">{step.description}</p>
              <motion.div
                className="rounded-lg overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={step.image || "/placeholder.svg"}
                  alt={step.title}
                  width={300}
                  height={200}
                  className="w-full"
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AITechnologySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            className="rounded-xl overflow-hidden border shadow-lg order-2 md:order-1"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
              <Image
                src="/Advanced Health AI.webp?height=600&width=600&text=AI+Technology+Visualization"
                alt="AI Technology"
                width={600}
                height={600}
                className="w-full"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="order-1 md:order-2"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
              AI Technology
            </div>
            <h2 className="text-3xl font-bold mb-6 text-balance">Powered by Advanced AI</h2>
            <p className="text-lg text-muted-foreground mb-6 text-pretty">
              Our sophisticated AI algorithms analyze thousands of nutritional data points to create the perfect meal
              plan for you.
            </p>
            <ul className="space-y-4">
              {[
                {
                  icon: <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />,
                  title: "Personalized Recommendations",
                  description: "AI that learns your preferences and adapts to your feedback.",
                },
                {
                  icon: <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />,
                  title: "Nutritional Analysis",
                  description: "Advanced algorithms ensure balanced and healthy meal plans.",
                },
                {
                  icon: <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />,
                  title: "Continuous Improvement",
                  description: "Our AI gets smarter with every meal plan it creates.",
                },
              ].map((item, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 * index + 0.4 }}
                >
                  {item.icon}
                  <div>
                    <span className="font-medium">{item.title}</span>
                    <p className="text-muted-foreground text-pretty">{item.description}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Button className="mt-6">Learn About Our Technology</Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const testimonials = [
 {
  quote:
    "FitTrack made weight loss so easy for me. I lost 20 pounds in just 3 months while still enjoying my favorite foods. The AI consultations kept me motivated every single day!",
  name: "Ayesha K.",
  role: "Lost 20 lbs in 3 months",
  avatar: "/placeholder.svg?height=100&width=100&text=Ayesha",
},
{
  quote:
    "As a busy professional in Karachi, FitTrack completely automated my meal planning and nutrition tracking. I've never been this consistent with my diet before.",
  name: "Hamza.",
  role: "Built muscle while managing a busy work routine",
  avatar: "/placeholder.svg?height=100&width=100&text=Hamza",
},
{
  quote:
    "The AI consultation feature, along with my workout plan, gave me the personalized guidance I always needed. Now I understand nutrition in a scientific and practical way.",
  name: "Fatima R.",
  role: "Improved energy & overall fitness",
  avatar: "/placeholder.svg?height=100&width=100&text=Fatima",
},

  ]

  return (
    <section id="testimonials" ref={ref} className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          className="text-center mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
            Testimonials
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Success Stories</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            See how FitTrack has helped people transform their lives.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-card rounded-lg p-6 shadow-sm border"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="flex items-center mb-4">
                <motion.div
                  className="mr-4"
                  initial={{ scale: 0.8 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.1 * index + 0.2 }}
                >
                  <Image
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                </motion.div>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <p className="italic text-pretty">"{testimonial.quote}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section id="pricing" ref={ref} className="py-20 bg-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          className="text-center mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">Pricing</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Choose the plan that fits your needs. No hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: "Basic",
              description: "For individuals just starting their fitness journey",
              price: "Pkr 499.99",
              features: [
                "AI meal plan generation",
                "Nutrition tracking dashboard",
                "Weekly meal calendar",
                "Basic health metrics (BMI, BMR, TDEE)",
                "Mobile & web access",
              ],
              popular: false,
              delay: 0,
            },
            {
              title: "Premium",
              description: "For serious fitness enthusiasts & goal-seekers",
              price: "Pkr 999.99",
              features: [
                "Advanced AI meal planning with preferences",
                "Complete nutrition analytics & trends",
                "AI consultation chat (unlimited)",
                "Workout integration & calorie sync",
                "Advanced health metrics & body comp tracking",
                "1 nutritionist consultation/month",
              ],
              popular: true,
              delay: 0.1,
            },
            {
              title: "Ultimate",
              description: "For maximum results and family wellness",
              price: "Pkr 1999.99",
              features: [
                "Everything in Premium",
                "3 professional nutritionist consultations/month",
                "Personalized workout plan creation",
                "Family accounts (up to 5 members)",
                "Priority email support & priority queue",
                "Advanced AI recipe customization",
                "Meal prep optimization & shopping lists",
              ],
              popular: false,
              delay: 0.2,
            },
          ].map((plan, index) => (
            <motion.div
              key={index}
              className={`rounded-lg border ${plan.popular ? "bg-primary/5 shadow-lg relative" : "bg-card shadow-sm"} p-6`}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: plan.delay }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs rounded-bl-lg rounded-tr-lg font-medium">
                  Popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-xl font-bold">{plan.title}</h3>
                <p className="text-muted-foreground text-pretty">{plan.description}</p>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground"> / month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <motion.li
                    key={featureIndex}
                    className="flex items-center"
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.3, delay: plan.delay + 0.1 * featureIndex }}
                  >
                    <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span className="text-pretty">{feature}</span>
                  </motion.li>
                ))}
              </ul>
              <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const faqs = [
    {
      question: "How does FitTrack's AI create personalized meal plans?",
      answer:
        "FitTrack analyzes your fitness goals, current weight, dietary preferences, allergies, and activity level using advanced AI to create customized meal plans. It continuously learns from your feedback to improve recommendations.",
    },
    {
      question: "Can I sync my workouts with my meal plan?",
      answer:
        "Yes! FitTrack integrates with popular fitness trackers to see your workout data and automatically adjust your calorie and macro targets based on your actual daily activity.",
    },
    {
      question: "How accurate are the nutrition calculations?",
      answer:
        "Our nutrition database includes over 1 million foods with verified nutritional data. All calculations are automated - no manual counting needed. Macros are tracked to the gram.",
    },
    {
      question: "Can I chat with AI about my specific meal and workout plans?",
      answer:
        "Our AI consultation agent lets you mention your current plans directly in chat. The AI provides personalized guidance based on your actual fitness data and goals.",
    },
    {
      question: "Do you offer real nutritionist consultations?",
      answer:
        "Yes, Premium and Ultimate plans include monthly sessions with certified nutritionists who review your progress and provide expert personalized advice.",
    },
    {
      question: "How is my data encrypted and stored securely?",
      answer:
        "All personal data is encrypted end-to-end and stored securely on our servers. We comply with GDPR and don't share your information with third parties.",
    },
  ]

  return (
    <section id="faq" ref={ref} className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          className="text-center mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">FAQ</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground text-pretty">Find answers to common questions about FitTrack.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <h3 className="text-lg font-medium text-balance">{faq.question}</h3>
              <p className="text-muted-foreground text-pretty">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  return (
    <section ref={ref} className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-6 text-balance"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Ready to Transform Your Nutrition?
        </motion.h2>
        <motion.p
          className="text-xl max-w-2xl mx-auto mb-10 text-pretty"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Join thousands of users who have achieved their health goals with FitTrack.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">
              Get Started Today <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t py-12 bg-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Utensils className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FitTrack</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FitTrack. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
