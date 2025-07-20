"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Building2, Users, Briefcase, Code, TrendingUp, MapPin, Clock, Filter, Search, X, Menu } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"

export default function CornellJobsLanding() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-red-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Cracked@Cornell</span>
        </Link>
        {/* Desktop Nav */}
        <nav className="ml-auto gap-4 sm:gap-6 hidden md:flex items-center">
          <Link href="/#philosophy" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            Our Philosophy
          </Link>
          <Link href="/#employers" className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors">
            Employers
          </Link>
          <Link href="/#students" className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors">
            Students
          </Link>
          <Link href="/#schools" className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors">
            Schools
          </Link>
          <div className="flex gap-2">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              Sign Up
            </Button>
            <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
              Log In
            </Button>
          </div>
        </nav>
        {/* Hamburger for mobile */}
        <div className="ml-auto flex md:hidden">
          <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 max-w-xs w-full">
              <DialogTitle className="sr-only">Main Menu</DialogTitle>
              <div className="flex flex-col gap-4 p-6">
                <Link href="/" className="flex items-center mb-4" onClick={() => setMobileNavOpen(false)}>
                  <GraduationCap className="h-7 w-7 text-red-600" />
                  <span className="ml-2 text-lg font-bold text-gray-900">Cracked@Cornell</span>
                </Link>
                <nav className="flex flex-col gap-3">
                  <Link href="/#philosophy" className="text-base font-medium text-red-600 hover:text-red-700 transition-colors" onClick={() => setMobileNavOpen(false)}>
                    Our Philosophy
                  </Link>
                  <Link href="/#employers" className="text-base font-medium text-gray-900 hover:text-red-600 transition-colors" onClick={() => setMobileNavOpen(false)}>
                    Employers
                  </Link>
                  <Link href="/#students" className="text-base font-medium text-gray-900 hover:text-red-600 transition-colors" onClick={() => setMobileNavOpen(false)}>
                    Students
                  </Link>
                  <Link href="/#schools" className="text-base font-medium text-gray-900 hover:text-red-600 transition-colors" onClick={() => setMobileNavOpen(false)}>
                    Schools
                  </Link>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 w-full text-white">Sign Up</Button>
                  <Button variant="outline" size="sm" className="w-full border-gray-300 hover:bg-gray-50">Log In</Button>
                </nav>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-red-50 to-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">🎓 Built for Cornell Students</Badge>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-gray-900">
                    Ditch HandShake. <span className="text-red-600"> Get Cracked at Cornell.</span>
                  </h1>
                  <p className="max-w-[600px] text-gray-600 md:text-xl">
                    Discover internships, research gigs, freelance roles, and part-time jobs—all posted just for Cornell
                    students by employers who want you.
                  </p>
                  <p className="max-w-[600px] text-gray-600">
                    Whether you're looking to break into finance, land a SWE internship, or help a local startup grow,
                    this is your edge.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700">
                    Find Your Next Opportunity
                  </Button>
                  <Button variant="outline" size="lg">
                    Post a Job
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>500+ Cornell students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>50+ verified employers</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <Image
                    src="/placeholder.svg?height=400&width=400"
                    width="400"
                    height="400"
                    alt="Cornell students working"
                    className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-lg shadow-lg border">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Live opportunities</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-900">
                  Why Cornell Students Choose Us
                </h2>
                <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We're not just another job board. We're your competitive advantage in the job market.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card className="border-2 hover:border-red-200 transition-colors">
                <CardHeader>
                  <Building2 className="h-10 w-10 text-red-600" />
                  <CardTitle>🛠️ Verified Cornell Employers</CardTitle>
                  <CardDescription>
                    Every employer is vetted and specifically wants Cornell talent. No spam, no scams.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2 hover:border-red-200 transition-colors">
                <CardHeader>
                  <Filter className="h-10 w-10 text-red-600" />
                  <CardTitle>🔎 Smart Filtering</CardTitle>
                  <CardDescription>
                    Filter by major, availability, skills, and even your clubs. Find opportunities that actually fit.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2 hover:border-red-200 transition-colors">
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-red-600" />
                  <CardTitle>🌐 Expanding to Ivy+</CardTitle>
                  <CardDescription>
                    Soon expanding to other top universities. Get in early and build your network.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Opportunities Section */}
        <section id="opportunities" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-900">
                  Every Type of Opportunity
                </h2>
                <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From quick gigs to career-launching internships, find what fits your schedule and goals.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="grid gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <Code className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-bold">Tech & Engineering</h3>
                      <p className="text-gray-600">SWE internships, research positions, startup roles</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="text-xl font-bold">Finance & Consulting</h3>
                      <p className="text-gray-600">Investment banking, consulting, fintech opportunities</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <Briefcase className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="text-xl font-bold">Research & Academia</h3>
                      <p className="text-gray-600">Lab positions, research assistantships, academic projects</p>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="grid gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <Clock className="h-8 w-8 text-orange-600" />
                    <div>
                      <h3 className="text-xl font-bold">Part-Time & Flexible</h3>
                      <p className="text-gray-600">Work around your class schedule with flexible hours</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <MapPin className="h-8 w-8 text-red-600" />
                    <div>
                      <h3 className="text-xl font-bold">Local to Ithaca</h3>
                      <p className="text-gray-600">On-campus and local Ithaca opportunities</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <Users className="h-8 w-8 text-indigo-600" />
                    <div>
                      <h3 className="text-xl font-bold">Freelance & Projects</h3>
                      <p className="text-gray-600">Short-term projects and freelance opportunities</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Employers Section */}
        <section id="employers" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">For Employers</Badge>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-900">
                    Hire Cornell's Best Talent
                  </h2>
                  <p className="max-w-[600px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Access a curated pool of motivated Cornell students across all majors. From computer science to
                    business, engineering to liberal arts.
                  </p>
                </div>
                <ul className="grid gap-4">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span>Pre-screened Cornell students only</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span>Easy posting and candidate management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span>Direct access to top-tier talent</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700">
                    Post Your First Job
                  </Button>
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </div>
              </div>
              <Image
                src="/placeholder.svg?height=400&width=500"
                width="500"
                height="400"
                alt="Employers hiring Cornell students"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-red-600">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">
                  Ready to Find Your Next Opportunity?
                </h2>
                <p className="mx-auto max-w-[600px] text-red-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join hundreds of Cornell students who've already found their perfect opportunity.
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-2">
                <form className="flex gap-2">
                  <Input type="email" placeholder="Enter your Cornell email" className="max-w-lg flex-1 bg-white" />
                  <Button type="submit" variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
                    Get Started
                  </Button>
                </form>
                <p className="text-xs text-red-100">
                  Cornell email required. Free for students.{" "}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-red-600" />
          <p className="text-xs text-gray-600">© 2024 CornellJobs. Made with ❤️ for Cornell students.</p>
        </div>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/about" className="text-xs hover:underline underline-offset-4 text-gray-600">
            About
          </Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4 text-gray-600">
            Privacy
          </Link>
          <Link href="/terms" className="text-xs hover:underline underline-offset-4 text-gray-600">
            Terms
          </Link>
          <Link href="/contact" className="text-xs hover:underline underline-offset-4 text-gray-600">
            Contact
          </Link>
        </nav>
      </footer>
    </div>
  )
}
