"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Briefcase, MapPin, Filter, Search, X } from "lucide-react"

type Job = {
  id: string
  title: string
  job_type: string
  location: string
  is_paid: boolean
  employer: { name: string }
}

type Major = {
  id: string
  name: string
}

const jobTypes = ["Internship", "Full-Time", "Part-Time", "Research", "Freelance", "On-Campus"]

// Job type to icon/color mapping
const jobTypeStyles: Record<string, { color: string; bgColor: string }> = {
  Internship: { color: "text-blue-800", bgColor: "bg-blue-100" },
  "Full-Time": { color: "text-purple-800", bgColor: "bg-purple-100" },
  "Part-Time": { color: "text-orange-800", bgColor: "bg-orange-100" },
  Research: { color: "text-indigo-800", bgColor: "bg-indigo-100" },
  Freelance: { color: "text-teal-800", bgColor: "bg-teal-100" },
  "On-Campus": { color: "text-red-800", bgColor: "bg-red-100" },
}

export default function JobPortal() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [majors, setMajors] = useState<Major[]>([])
  const [filters, setFilters] = useState({
    major: "all",
    jobType: "all",
    isPaid: "all",
    location: "",
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    fetchMajors()
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [filters])

  async function fetchMajors() {
    const { data, error } = await supabase.from("majors").select("*")
    if (!error && data) setMajors(data)
  }

  async function fetchJobs() {
    try {
      let jobIds: string[] = []

      // Step 1: Get job IDs for selected major
      if (filters.major !== "all") {
        const { data: majorLinks, error: majorError } = await supabase
          .from("job_majors")
          .select("job_id")
          .eq("major_id", filters.major)

        if (majorError) throw majorError

        jobIds = majorLinks.map((item) => item.job_id)

        if (jobIds.length === 0) {
          setJobs([]) // no jobs for selected major
          return
        }
      }

      // Step 2: Build job query
      let query = supabase
        .from("jobs")
        .select("id, title, job_type, location, is_paid, employer:employers(name)")
        .order("created_at", { ascending: false })

      if (filters.jobType !== "all") query = query.eq("job_type", filters.jobType)
      if (filters.isPaid !== "all") query = query.eq("is_paid", filters.isPaid === "paid")
      if (filters.location) query = query.ilike("location", `%${filters.location}%`)
      if (filters.major !== "all" && jobIds.length > 0) query = query.in("id", jobIds)

      const { data, error } = await query

      if (error) {
        console.error("❌ Supabase query error:", error)
      } else {
        const normalized = data.map((job) => ({
          ...job,
          employer: Array.isArray(job.employer) ? job.employer[0] : job.employer,
        }))
        setJobs(normalized)
      }
    } catch (err) {
      console.error("❌ Unexpected fetch error:", err)
    }
  }

  function handleFilterChange(name: string, value: string) {
    setFilters({ ...filters, [name]: value })
  }

  function clearFilters() {
    setFilters({
      major: "all",
      jobType: "all",
      isPaid: "all",
      location: "",
    })
  }

  // Count active filters
  const activeFilterCount = Object.values(filters).filter((value) => value !== "all").length

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-red-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Cracked@Cornell</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/#features" className="text-sm font-medium hover:text-red-600 transition-colors">
            Features
          </Link>
          <Link href="/#opportunities" className="text-sm font-medium hover:text-red-600 transition-colors">
            Opportunities
          </Link>
          <Link href="/#employers" className="text-sm font-medium hover:text-red-600 transition-colors">
            For Employers
          </Link>
        </nav>
        <div className="ml-6 flex gap-2">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700">
            Post a Job
          </Button>
        </div>
      </header>

      <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Job Opportunities</h1>
            <p className="text-gray-600 mt-1">Find your next opportunity at Cornell</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && <Badge className="ml-1 bg-red-600">{activeFilterCount}</Badge>}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear all filters">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Mobile: Conditional, Desktop: Always visible */}
          <aside
            className={`${isFilterOpen ? "block" : "hidden"} lg:block w-full lg:w-1/4 bg-gray-50 p-4 rounded-lg border`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Filters</h2>
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsFilterOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Major</label>
                <Select value={filters.major} onValueChange={(value) => handleFilterChange("major", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Majors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Majors</SelectItem>
                    {majors.map((major) => (
                      <SelectItem key={major.id} value={major.id}>
                        {major.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Job Type</label>
                <Select value={filters.jobType} onValueChange={(value) => handleFilterChange("jobType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {jobTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Compensation</label>
                <Select value={filters.isPaid} onValueChange={(value) => handleFilterChange("isPaid", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="paid">Paid Only</SelectItem>
                    <SelectItem value="unpaid">Unpaid Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Location</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    className="pl-9"
                    placeholder="e.g. Remote, Ithaca"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                  />
                </div>
              </div>

              <Button className="w-full bg-red-600 hover:bg-red-700 mt-2" onClick={() => setIsFilterOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </aside>

          {/* Job Listings */}
          <main className="flex-1">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No matching jobs found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your filters or check back later</p>
                {activeFilterCount > 0 && (
                  <Button variant="link" className="mt-2 text-red-600" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job) => {
                  const typeStyle = jobTypeStyles[job.job_type] || { color: "text-gray-800", bgColor: "bg-gray-100" }

                  return (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                      <Card className="h-full overflow-hidden hover:border-red-200 transition-colors">
                        <div className="p-5 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-lg line-clamp-2">{job.title}</h3>
                            <Badge className={`${typeStyle.bgColor} ${typeStyle.color} border-0`}>{job.job_type}</Badge>
                          </div>

                          <div className="flex items-center gap-1 text-gray-700 mb-1">
                            <Briefcase className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{job.employer?.name}</span>
                          </div>

                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{job.location}</span>
                          </div>

                          <div className="mt-auto pt-3 flex items-center gap-2">
                            {job.is_paid ? (
                              <Badge className="bg-green-100 text-green-800 border-0">Paid</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">
                                Unpaid
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500 ml-auto">View Details →</span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-gray-50">
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
