"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, MapPin, Filter, Search, Menu, XIcon } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import Fuse from "fuse.js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"

type Job = {
  id: string
  title: string
  job_type: string
  location: string
  is_paid: boolean
  is_cornell_only: boolean
  employer: { id: string, name: string, logo?: string }
  description_short?: string
}

type Major = {
  id: string
  name: string
}

const jobTypes = ["Internship", "Full-Time", "Part-Time", "Research", "Project Team", "On-Campus"]

/*
The gradients on the job boxes match the type of jobs. 
Currently, the colors are:
- Internship: Blue
- Full-Time: Purple
- Part-Time: Orange
- Research: Indigo
- Project Team: Teal
- On-Campus: Red
*/
const jobTypeStyles: Record<string, { color: string; bgColor: string }> = {
  Internship: { color: "text-blue-800", bgColor: "bg-blue-100" },
  "Full-Time": { color: "text-purple-800", bgColor: "bg-purple-100" },
  "Part-Time": { color: "text-orange-800", bgColor: "bg-orange-100" },
  Research: { color: "text-indigo-800", bgColor: "bg-indigo-100" },
  "Project Team": { color: "text-teal-800", bgColor: "bg-teal-100" },
  "On-Campus": { color: "text-red-800", bgColor: "bg-red-100" },
}

const jobTypeGradients: Record<string, string> = {
  Internship: "from-blue-200 to-blue-400",
  "Full-Time": "from-purple-200 to-purple-400",
  "Part-Time": "from-orange-200 to-orange-400",
  Research: "from-indigo-200 to-indigo-400",
  "Project Team": "from-teal-200 to-teal-400",
  "On-Campus": "from-red-200 to-red-400",
}

export default function JobPortal() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [majors, setMajors] = useState<Major[]>([])
  const [filters, setFilters] = useState({
    majors: [] as string[],
    jobTypes: [] as string[],
    isPaid: "all",
    location: "",
    cornellOnly: false,
    preferences: [] as string[], 
  })
  const [searchTitle, setSearchTitle] = useState("")
  const [openMajor, setOpenMajor] = useState(false)
  const [openJobType, setOpenJobType] = useState(false)
  const [openCompensation, setOpenCompensation] = useState(false)
  const [openPreferences, setOpenPreferences] = useState(false) // new
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  //These are the mobile filters that are open
  const [openMajorMobile, setOpenMajorMobile] = useState(false)
  const [openJobTypeMobile, setOpenJobTypeMobile] = useState(false)
  const [openCompensationMobile, setOpenCompensationMobile] = useState(false)
  const [openPreferencesMobile, setOpenPreferencesMobile] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(null)
  const [jobDetailsLoading, setJobDetailsLoading] = useState(false)
  const [scrollPosition, setScrollPosition] = useState<number | null>(null)

  useEffect(() => {
    fetchMajors()
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [filters, searchTitle])

  // Fetch full job details when selectedJobId changes
  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJobDetails(null)
      return
    }
    setJobDetailsLoading(true)
    async function fetchJobDetails() {
      // Fetch job details with all required fields
      const { data: job, error } = await supabase
        .from("jobs")
        .select(`
          *,
          employer:employers(id, name, logo, description),
          job_majors:job_majors(job_id, major:majors(id, name))
        `)
        .eq("id", selectedJobId)
        .single()
      setJobDetailsLoading(false)
      if (error || !job) {
        setSelectedJobDetails(null)
        return
      }
      setSelectedJobDetails(job)
    }
    fetchJobDetails()
  }, [selectedJobId])

  // Restore scroll on dialog close
  useEffect(() => {
    if (!selectedJobId && scrollPosition !== null) {
      window.scrollTo({ top: scrollPosition })
      setScrollPosition(null)
    }
  }, [selectedJobId])

  // After the useEffect for fetching job details and restoring scroll
  useEffect(() => {
    if (selectedJobId) {
      // Prevent background scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll
      document.body.style.overflow = '';
    }
    // Clean up in case component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedJobId]);

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
        .select("id, title, job_type, location, is_paid, is_cornell_only, employer:employers(id, name, logo), description_short")
        .order("created_at", { ascending: false })
      if (filters.jobTypes.length > 0) query = query.in("job_type", filters.jobTypes)
      if (filters.isPaid !== "all") query = query.eq("is_paid", filters.isPaid === "paid")
      if (filters.location) query = query.ilike("location", `%${filters.location}%`)
      if (filters.majors.length > 0 && jobIds.length > 0) query = query.in("id", jobIds)
      if (filters.cornellOnly) query = query.eq("is_cornell_only", true)
      if (filters.preferences.includes("cornellOnly")) query = query.eq("is_cornell_only", true)
      if (filters.preferences.includes("recruiterContact")) {
        query = query.or('contact_email.not.is.null,contact_linkedin.not.is.null')
      }
      if (filters.preferences.includes("optCptFriendly")) {
        query = query.eq("opt_cpt_friendly", true)
      }
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

  function togglePreference(pref: string) {
    const newPrefs = filters.preferences.includes(pref)
      ? filters.preferences.filter(p => p !== pref)
      : [...filters.preferences, pref]
    setFilters({ ...filters, preferences: newPrefs })
  }

  function clearFilters() {
    setFilters({
      majors: [],
      jobTypes: [],
      isPaid: "all",
      location: "",
      cornellOnly: false,
      preferences: [],
    })
  }

  // Count active filters
  const activeFilterCount = [
    filters.majors.length,
    filters.jobTypes.length,
    filters.isPaid !== "all" ? 1 : 0,
    filters.location ? 1 : 0,
    filters.cornellOnly ? 1 : 0,
    filters.preferences.length,
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
      <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Student Opportunities</h1>
            <p className="text-gray-600 mt-1">Find your next opportunity at Cornell and beyond.</p>
          </div>
        </div>
        {/* Mobile Filters Button */}
        <div className="flex lg:hidden mb-4">
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
              <DialogTitle className="sr-only">Filters</DialogTitle>
              <div className="p-6 flex flex-col gap-4 pt-10">
                {/* All filter controls stacked vertically */}
                <div className="flex flex-col gap-3">
                  <Input
                    type="text"
                    placeholder="Search"
                    value={searchTitle}
                    onChange={e => setSearchTitle(e.target.value)}
                    className="w-full bg-white"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Popover open={openMajorMobile} onOpenChange={setOpenMajorMobile} modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openMajorMobile}
                        className="w-full justify-between pr-8"
                      >
                        {filters.majors.length > 0
                          ? `${filters.majors.length} selected`
                          : "Majors"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
                  <Popover open={openJobTypeMobile} onOpenChange={setOpenJobTypeMobile} modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openJobTypeMobile}
                        className="w-full justify-between pr-8"
                      >
                        {filters.jobTypes.length > 0
                          ? `${filters.jobTypes.length} selected`
                          : "Job Type"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
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
                  <Popover open={openCompensationMobile} onOpenChange={setOpenCompensationMobile} modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCompensationMobile}
                        className="w-full justify-between pr-8"
                      >
                        {filters.isPaid === "all"
                          ? "Pay Type"
                          : filters.isPaid === "paid"
                          ? "Paid only"
                          : "Unpaid only"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              handleFilterChange("isPaid", "all")
                              setOpenCompensationMobile(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.isPaid === "all" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            All comp types
                          </CommandItem>
                          <CommandItem
                            onSelect={() => {
                              handleFilterChange("isPaid", "paid")
                              setOpenCompensationMobile(false)
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
                              setOpenCompensationMobile(false)
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
                  <Popover open={openPreferencesMobile} onOpenChange={setOpenPreferencesMobile} modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPreferencesMobile}
                        className="w-full justify-between pr-8"
                      >
                        {filters.preferences.length > 0
                          ? `${filters.preferences.length} selected`
                          : "Select preferences..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              togglePreference("cornellOnly")
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.preferences.includes("cornellOnly") ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Cornell Only
                          </CommandItem>
                          <CommandItem
                            onSelect={() => {
                              togglePreference("recruiterContact")
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.preferences.includes("recruiterContact") ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Recruiter Contact
                          </CommandItem>
                          <CommandItem
                            onSelect={() => {
                              togglePreference("optCptFriendly")
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.preferences.includes("optCptFriendly") ? "opacity-100" : "opacity-0"
                              )}
                            />
                            OPT/CPT Friendly
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-3">
                  <Input
                    className="w-full"
                    placeholder="Location"
                    value={filters.location}
                    onChange={e => handleFilterChange("location", e.target.value)}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearFilters();
                      setSearchTitle("");
                      setMobileFilterOpen(false);
                    }}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {/* Desktop Filters Row */}
        <div className="bg-gray-50 border rounded-lg p-4 mb-8 flex flex-nowrap gap-4 items-end hidden lg:flex overflow-x-auto">
          <div className="flex-1 min-w-[140px] flex flex-col justify-end">
            <Input
              type="text"
              placeholder="Search"
              value={searchTitle}
              onChange={e => setSearchTitle(e.target.value)}
              className="w-full bg-white"
            />
          </div>
          <div className="min-w-[120px] flex flex-col justify-end">
            <Popover open={openMajor} onOpenChange={setOpenMajor} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openMajor}
                  className="w-full justify-between pr-8"
                >
                  {filters.majors.length > 0
                    ? `${filters.majors.length} selected`
                    : "Majors"}
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
          <div className="min-w-[120px] flex flex-col justify-end">
            <Popover open={openJobType} onOpenChange={setOpenJobType} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openJobType}
                  className="w-full justify-between pr-8"
                >
                  {filters.jobTypes.length > 0
                    ? `${filters.jobTypes.length} selected`
                    : "Job Type"}
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
          <div className="min-w-[120px] flex flex-col justify-end">
            <Popover open={openCompensation} onOpenChange={setOpenCompensation} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCompensation}
                  className="w-full justify-between pr-8"
                >
                  {filters.isPaid === "all"
                    ? "Pay Type"
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
                      All comp types
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
          <div className="min-w-[120px] flex flex-col justify-end">
            <Popover open={openPreferences} onOpenChange={setOpenPreferences} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPreferences}
                  className="w-full justify-between pr-8"
                >
                  {filters.preferences.length > 0
                    ? `${filters.preferences.length} selected`
                    : "Preferences"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        togglePreference("cornellOnly")
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.preferences.includes("cornellOnly") ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Cornell Only
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        togglePreference("recruiterContact")
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.preferences.includes("recruiterContact") ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Recruiter Contact
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        togglePreference("optCptFriendly")
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.preferences.includes("optCptFriendly") ? "opacity-100" : "opacity-0"
                        )}
                      />
                      OPT/CPT Friendly
                    </CommandItem>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="min-w-[120px] flex flex-col justify-end">
            <Input
              className="w-full"
              placeholder="Location"
              value={filters.location}
              onChange={e => handleFilterChange("location", e.target.value)}
            />
          </div>
          <div className="flex items-end ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearFilters();
                        setSearchTitle("");
                      }}
                      className="text-xs whitespace-nowrap"
                    >
                      Clear
                    </Button>
          </div>
        </div>

        {/* Scrollable grid+drawer area */}
        <div className="flex flex-col lg:flex-row gap-6 relative flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 220px)' }}>
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
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 transition-all duration-300">
                {jobs.map((job) => {
                  const typeStyle = jobTypeStyles[job.job_type] || { color: "text-gray-800", bgColor: "bg-gray-100" }
                  const gradient = jobTypeGradients[job.job_type] || "from-gray-200 to-gray-400"
                  return (
                    <div key={job.id} className="block cursor-pointer" onClick={() => {
                      setScrollPosition(window.scrollY)
                      setSelectedJobId(job.id)
                    }}>
                      <Card className="h-full overflow-hidden hover:border-red-200 transition-colors m-0 mt-0 p-0 pt-0">
                        <div
                          className={`relative w-full bg-gradient-to-br ${gradient} p-6 flex items-center justify-center m-0 mt-0 pt-0`}
                          style={{ borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem', minHeight: '140px', marginTop: 0, paddingTop: 0 }}
                        >
                          {/* Subtle overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

                          {/* Logo or Company Initial */}
                          <div className="relative z-10 flex items-center justify-center mt-4">
                            {job.employer?.logo ? (
                              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                                <img
                                  src={job.employer.logo}
                                  alt={`${job.employer.name} logo`}
                                  className="h-16 w-16 md:h-20 md:w-20 object-contain"
                                />
                              </div>
                            ) : (
                              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg flex items-center justify-center min-w-[80px] md:min-w-[96px]">
                                <div className="text-center">
                                  <div className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                                    {job.employer?.name?.charAt(0)?.toUpperCase() || 'C'}
                                  </div>
                                  <div className="text-xs font-medium text-gray-600 leading-tight">
                                    {job.employer?.name?.split(' ').slice(0, 2).join(' ') || 'Company'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Cornell Only Star Badge (if desired up here too) */}
                          {false && job.is_cornell_only && (
                            <div className="absolute top-4 right-4">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="bg-red-500 text-white p-2 rounded-full shadow-lg cursor-help">
                                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                      </svg>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs text-center">
                                    This opportunity is only available for Cornell students, reducing the possible applicant pool.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>

                        <div className="px-5 pt-4 pb-5 flex flex-col h-full">
                          <h3 className="font-semibold text-xl text-left mb-3">{job.title}</h3>
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
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{job.location}</span>
                          </div>
                          <div className="text-sm pt-3 flex items-center gap-2">
                            {job.is_paid ? (
                              <Badge className="bg-green-100 text-green-800 border-0">Paid</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">Unpaid</Badge>
                            )}
                            <span className="text-sm text-gray-500 ml-auto">View Details & Apply →</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
          {/* Job Details Drawer (desktop & mobile) */}
          {selectedJobId && (
            <div
              className="hidden lg:block fixed right-0 top-[140px] bottom-[80px] h-auto overflow-y-auto w-[80%] min-w-[400px] max-w-[700px] z-30 bg-white shadow-2xl border-l transition-transform duration-300 rounded-lg"
              style={{ transform: selectedJobId ? 'translateX(0)' : 'translateX(100%)' }}
              role="dialog"
              aria-label="Job Details"
              tabIndex={-1}
            >
              <button
                className="absolute top-4 right-4 z-40 p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label="Close job details"
                onClick={() => setSelectedJobId(null)}
              >
                <XIcon className="h-6 w-6" />
              </button>
              <div className="p-8 pt-12">
                {jobDetailsLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : selectedJobDetails ? (
                  <div className="flex flex-col gap-6">
                    {/* Employer Logo */}
                    <div className="flex flex-col items-center gap-2">
                      {selectedJobDetails.employer?.logo && (
                        <img src={selectedJobDetails.employer.logo} alt="Employer Logo" className="h-20 w-20 object-contain rounded-2xl shadow" />
                      )}
                      <div className="text-lg font-bold text-center">{selectedJobDetails.title}</div>
                      <div className="text-gray-700 text-center">{selectedJobDetails.employer?.name}</div>
                      {selectedJobDetails.job_link && (
                        <a
                          href={selectedJobDetails.job_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mb-2 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition-colors text-center"
                        >
                          Apply
                        </a>
                      )}
                    </div>
                    {/* Job Details Section */}
                    <div className="flex flex-col gap-2 border-t pt-4">
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge className="text-md">{selectedJobDetails.job_type}</Badge>
                        {selectedJobDetails.is_paid ? (
                          <Badge className="bg-green-100 text-green-800 border-0 text-md">Paid{selectedJobDetails.pay ? `: $${selectedJobDetails.pay}` : ''}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 text-md">Unpaid</Badge>
                        )}
                        {selectedJobDetails.is_cornell_only && (
                          <Badge className="bg-red-100 text-red-800 border-0 text-md">Cornell Only</Badge>
                        )}
                        {selectedJobDetails.opt_cpt_friendly && (
                          <Badge className="bg-blue-100 text-blue-800 border-0 text-md">OPT/CPT Friendly</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 items-center text-md text-gray-700">
                        {selectedJobDetails.time_commitment && (
                          <span><b>Time:</b> {selectedJobDetails.time_commitment}</span>
                        )}
                        {selectedJobDetails.application_deadline && (
                          <span><b>Deadline:</b> {selectedJobDetails.application_deadline}</span>
                        )}
                        <span><b>Location:</b> {selectedJobDetails.location}</span>
                      </div>
                      {selectedJobDetails.job_majors?.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center text-md">
                          <b>Majors:</b>
                          {selectedJobDetails.job_majors.map((jm: any) => (
                            <Badge key={jm.major.id}>{jm.major.name}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <hr className="border-gray-200" />
                    {/* Description */}
                    {selectedJobDetails.description_full && (
                      <>
                        <div className="font-bold text-md">Description</div>
                        <div className="text-gray-800 whitespace-pre-line">{selectedJobDetails.description_full}</div>
                      </>
                    )}
                    {/* Contact Info */}
                    {(selectedJobDetails.contact_name || selectedJobDetails.contact_email) && (
                      <div className="border-t pt-4">
                        <div className="font-semibold mb-1">Contact Information</div>
                        {selectedJobDetails.contact_name && <div>Name: {selectedJobDetails.contact_name}</div>}
                        {selectedJobDetails.contact_email && <div>Email: <a href={`mailto:${selectedJobDetails.contact_email}`} className="text-blue-600 underline">{selectedJobDetails.contact_email}</a></div>}
                      </div>
                    )}
                    {/* Employer Description */}
                    {selectedJobDetails.employer?.description && (
                      <div className="border-t pt-4">
                        <div className="font-semibold mb-1">About {selectedJobDetails.employer.name}</div>
                        <div className="text-gray-700 whitespace-pre-line">{selectedJobDetails.employer.description}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">No details found.</div>
                )}
              </div>
            </div>
          )}
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