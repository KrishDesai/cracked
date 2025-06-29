"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Briefcase, MapPin, Filter, Search, X, Menu } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import Fuse from "fuse.js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

type Job = {
  id: string
  title: string
  job_type: string
  location: string
  is_paid: boolean
  is_project_team: boolean
  is_cornell_only: boolean
  employer: { name: string }
  description_short?: string
}

type Major = {
  id: string
  name: string
}

const jobTypes = ["Internship", "Full-Time", "Part-Time", "Research", "Freelance", "On-Campus", "Project Team"]

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
    majors: [] as string[],
    jobTypes: [] as string[],
    isPaid: "all",
    location: "",
    cornellOnly: false
  })
  const [searchTitle, setSearchTitle] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [openMajor, setOpenMajor] = useState(false)
  const [openJobType, setOpenJobType] = useState(false)
  const [openCompensation, setOpenCompensation] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  useEffect(() => {
    fetchMajors()
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [filters, searchTitle])

  async function fetchMajors() {
    const { data, error } = await supabase.from("majors").select("*")
    if (!error && data) setMajors(data)
  }

  async function fetchJobs() {
    try {
      let jobIds: string[] = []
      if (filters.majors.length > 0) {
        const { data: majorLinks, error: majorError } = await supabase
          .from("job_majors")
          .select("job_id")
          .in("major_id", filters.majors)
        if (majorError) throw majorError
        jobIds = majorLinks.map((item) => item.job_id)
        if (jobIds.length === 0) {
          setJobs([])
          return
        }
      }
      let query = supabase
        .from("jobs")
        .select("id, title, job_type, location, is_paid, is_project_team, is_cornell_only, employer:employers(name), description_short")
        .order("created_at", { ascending: false })
      if (filters.jobTypes.length > 0) query = query.in("job_type", filters.jobTypes)
      if (filters.isPaid !== "all") query = query.eq("is_paid", filters.isPaid === "paid")
      if (filters.location) query = query.ilike("location", `%${filters.location}%`)
      if (filters.majors.length > 0 && jobIds.length > 0) query = query.in("id", jobIds)
      if (filters.cornellOnly) query = query.eq("is_cornell_only", true)
      const { data, error } = await query
      if (error) {
        console.error("❌ Supabase query error:", error)
      } else {
        const normalized = data.map((job) => ({
          ...job,
          employer: Array.isArray(job.employer) ? job.employer[0] : job.employer,
        }))
        let filtered = normalized
        if (searchTitle) {
          const fuse = new Fuse(filtered, {
            keys: [
              "title",
              "description_short",
              "location",
              "employer.name"
            ],
            threshold: 0.4, // Lower = stricter, higher = fuzzier
          })
          filtered = fuse.search(searchTitle).map(result => result.item)
        }
        setJobs(filtered)
      }
    } catch (err) {
      console.error("❌ Unexpected fetch error:", err)
    }
  }

  function handleFilterChange(name: string, value: string | string[] | boolean) {
    setFilters({ ...filters, [name]: value })
  }

  function toggleMajor(majorId: string) {
    const newMajors = filters.majors.includes(majorId)
      ? filters.majors.filter(id => id !== majorId)
      : [...filters.majors, majorId]
    handleFilterChange("majors", newMajors)
  }

  function toggleJobType(jobType: string) {
    const newJobTypes = filters.jobTypes.includes(jobType)
      ? filters.jobTypes.filter(type => type !== jobType)
      : [...filters.jobTypes, jobType]
    handleFilterChange("jobTypes", newJobTypes)
  }

  function clearFilters() {
    setFilters({
      majors: [],
      jobTypes: [],
      isPaid: "all",
      location: "",
      cornellOnly: false
    })
  }

  // Count active filters
  const activeFilterCount = [
    filters.majors.length,
    filters.jobTypes.length,
    filters.isPaid !== "all" ? 1 : 0,
    filters.location ? 1 : 0,
    filters.cornellOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-red-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Cracked@Cornell</span>
        </Link>
        {/* Desktop Nav */}
        <nav className="ml-auto gap-4 sm:gap-6 hidden md:flex">
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
        <div className="ml-6 gap-2 hidden md:flex">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700">
            Post a Job
          </Button>
        </div>
        {/* Hamburger for mobile */}
        <div className="ml-auto flex md:hidden">
          <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 max-w-xs w-full">
              <div className="flex flex-col gap-4 p-6">
                <Link href="/" className="flex items-center mb-4" onClick={() => setMobileNavOpen(false)}>
                  <GraduationCap className="h-7 w-7 text-red-600" />
                  <span className="ml-2 text-lg font-bold text-gray-900">Cracked@Cornell</span>
                </Link>
                <nav className="flex flex-col gap-3">
                  <Link href="/#features" className="text-base font-medium hover:text-red-600 transition-colors" onClick={() => setMobileNavOpen(false)}>
                    Features
                  </Link>
                  <Link href="/#opportunities" className="text-base font-medium hover:text-red-600 transition-colors" onClick={() => setMobileNavOpen(false)}>
                    Opportunities
                  </Link>
                  <Link href="/#employers" className="text-base font-medium hover:text-red-600 transition-colors" onClick={() => setMobileNavOpen(false)}>
                    For Employers
                  </Link>
                </nav>
                <div className="flex flex-col gap-2 mt-4">
                  <Button variant="ghost" size="sm" className="w-full">Sign In</Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 w-full">Post a Job</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Student Opportunities</h1>
            <p className="text-gray-600 mt-1">Find your next opportunity at Cornell and beyond.</p>
          </div>
        </div>
        {/* Mobile Filters Button */}
        <div className="flex md:hidden mb-4">
          <Dialog open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full flex items-center gap-2 justify-center">
                <Filter className="h-5 w-5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">{activeFilterCount}</span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm w-full p-0">
              <div className="p-6 flex flex-col gap-4">
                {/* All filter controls stacked vertically */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-medium">Search</label>
                  <Input
                    type="text"
                    placeholder="e.g. Data Science, Research"
                    value={searchTitle}
                    onChange={e => setSearchTitle(e.target.value)}
                    className="w-full bg-white"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-medium">Major</label>
                  <Popover open={openMajor} onOpenChange={setOpenMajor}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openMajor}
                        className="w-full justify-between"
                      >
                        {filters.majors.length > 0
                          ? `${filters.majors.length} selected`
                          : "Select majors..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search majors..." />
                        <CommandEmpty>No major found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {majors.map((major) => (
                            <CommandItem
                              key={major.id}
                              onSelect={() => {
                                toggleMajor(major.id)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.majors.includes(major.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {major.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-medium">Job Type</label>
                  <Popover open={openJobType} onOpenChange={setOpenJobType}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openJobType}
                        className="w-full justify-between"
                      >
                        {filters.jobTypes.length > 0
                          ? `${filters.jobTypes.length} selected`
                          : "Select job types..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search job types..." />
                        <CommandEmpty>No job type found.</CommandEmpty>
                        <CommandGroup>
                          {jobTypes.map((type) => (
                            <CommandItem
                              key={type}
                              onSelect={() => {
                                toggleJobType(type)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.jobTypes.includes(type) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {type}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-medium">Compensation</label>
                  <Popover open={openCompensation} onOpenChange={setOpenCompensation}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCompensation}
                        className="w-full justify-between"
                      >
                        {filters.isPaid === "all"
                          ? "All compensation types"
                          : filters.isPaid === "paid"
                          ? "Paid only"
                          : "Unpaid only"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              handleFilterChange("isPaid", "all")
                              setOpenCompensation(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.isPaid === "all" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            All compensation types
                          </CommandItem>
                          <CommandItem
                            onSelect={() => {
                              handleFilterChange("isPaid", "paid")
                              setOpenCompensation(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.isPaid === "paid" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Paid only
                          </CommandItem>
                          <CommandItem
                            onSelect={() => {
                              handleFilterChange("isPaid", "unpaid")
                              setOpenCompensation(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.isPaid === "unpaid" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Unpaid only
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-medium">Location</label>
                  <Input
                    className="w-full"
                    placeholder="e.g. Remote, Ithaca"
                    value={filters.location}
                    onChange={e => handleFilterChange("location", e.target.value)}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">Clear</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {/* Desktop Filters Row */}
        <div className="bg-gray-50 border rounded-lg p-4 mb-8 flex flex-wrap gap-4 items-end hidden md:flex">
          <div className="flex-1 min-w-[180px] flex flex-col">
            <label className="block mb-1 text-xs font-medium">Search</label>
            <Input
              type="text"
              placeholder="e.g. Data Science, Research"
              value={searchTitle}
              onChange={e => setSearchTitle(e.target.value)}
              className="w-full bg-white"
            />
          </div>
          <div className="min-w-[160px] flex flex-col">
            <label className="block mb-1 text-xs font-medium">Major</label>
            <Popover open={openMajor} onOpenChange={setOpenMajor}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openMajor}
                  className="w-full justify-between"
                >
                  {filters.majors.length > 0
                    ? `${filters.majors.length} selected`
                    : "Select majors..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search majors..." />
                  <CommandEmpty>No major found.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-auto">
                    {majors.map((major) => (
                      <CommandItem
                        key={major.id}
                        onSelect={() => {
                          toggleMajor(major.id)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.majors.includes(major.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {major.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="min-w-[160px] flex flex-col">
            <label className="block mb-1 text-xs font-medium">Job Type</label>
            <Popover open={openJobType} onOpenChange={setOpenJobType}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openJobType}
                  className="w-full justify-between"
                >
                  {filters.jobTypes.length > 0
                    ? `${filters.jobTypes.length} selected`
                    : "Select job types..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search job types..." />
                  <CommandEmpty>No job type found.</CommandEmpty>
                  <CommandGroup>
                    {jobTypes.map((type) => (
                      <CommandItem
                        key={type}
                        onSelect={() => {
                          toggleJobType(type)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.jobTypes.includes(type) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {type}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="min-w-[160px] flex flex-col">
            <label className="block mb-1 text-xs font-medium">Compensation</label>
            <Popover open={openCompensation} onOpenChange={setOpenCompensation}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCompensation}
                  className="w-full justify-between"
                >
                  {filters.isPaid === "all"
                    ? "All compensation types"
                    : filters.isPaid === "paid"
                    ? "Paid only"
                    : "Unpaid only"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        handleFilterChange("isPaid", "all")
                        setOpenCompensation(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.isPaid === "all" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All compensation types
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        handleFilterChange("isPaid", "paid")
                        setOpenCompensation(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.isPaid === "paid" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Paid only
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        handleFilterChange("isPaid", "unpaid")
                        setOpenCompensation(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.isPaid === "unpaid" ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Unpaid only
                    </CommandItem>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="min-w-[160px] flex flex-col">
            <label className="block mb-1 text-xs font-medium">Location</label>
            <Input
              className="w-full"
              placeholder="e.g. Remote, Ithaca"
              value={filters.location}
              onChange={e => handleFilterChange("location", e.target.value)}
            />
          </div>
          <div className="flex items-end ml-auto">
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">Clear</Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
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
                          <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                          <div className="flex items-center mb-2 gap-2">
                            <Badge className={`${typeStyle.bgColor} ${typeStyle.color} border-0 w-fit`}>{job.job_type}</Badge>
                            {job.is_cornell_only && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="bg-red-100 text-red-800 border-0 flex items-center gap-1 cursor-help">
                                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                      </svg>
                                      Cornell Only
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs text-center">
                                    This opportunity is only available for Cornell students, reducing the possible applicant pool.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {job.description_short && (
                            <p className="text-gray-700 text-sm mb-3 line-clamp-3">{job.description_short}</p>
                          )}
                          <div className="flex items-center gap-1 text-gray-700 mb-1 mt-auto">
                            <Briefcase className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{job.employer?.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{job.location}</span>
                          </div>
                          <div className="pt-3 flex items-center gap-2">
                            {job.is_paid ? (
                              <Badge className="bg-green-100 text-green-800 border-0">Paid</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">Unpaid</Badge>
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
