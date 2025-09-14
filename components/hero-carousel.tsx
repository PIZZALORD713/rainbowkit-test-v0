"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Zap, Shirt, Sparkles, Star } from "lucide-react"

interface CarouselSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  primaryCta: {
    text: string
    action: () => void
    variant: "primary" | "secondary"
  }
  secondaryCta: {
    text: string
    action: () => void
    variant: "primary" | "secondary"
  }
  features?: Array<{
    icon: React.ReactNode
    label: string
  }>
}

interface HeroCarouselProps {
  onSearchClick: () => void
  onConnectedWalletClick: () => void
}

export default function HeroCarousel({ onSearchClick, onConnectedWalletClick }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const slides: CarouselSlide[] = [
    {
      id: "customize",
      title: "Make Your Ora Uniquely Yours.",
      subtitle: "Explore your Sugartown Oras and give them personality.",
      description: "Explore your Sugartown Oras and give them personality.",
      image: "/images/ora-hero-reference.png",
      primaryCta: {
        text: "Open Your Vault",
        action: onConnectedWalletClick,
        variant: "primary",
      },
      secondaryCta: {
        text: "Browse Oras",
        action: onSearchClick,
        variant: "secondary",
      },
      features: [
        { icon: <Zap className="w-5 h-5" />, label: "Light" },
        { icon: <Shirt className="w-5 h-5" />, label: "Clothing" },
      ],
    },
    {
      id: "profiles",
      title: "Create Rich Character Profiles.",
      subtitle: "Build detailed Avatar Identity Models for each Ora.",
      description: "Define personality traits, backstories, and behavioral patterns that make each character unique.",
      image: "/images/ora-hero-clean.png",
      primaryCta: {
        text: "Start Creating",
        action: onSearchClick,
        variant: "primary",
      },
      secondaryCta: {
        text: "Learn More",
        action: () => document.getElementById("aim-info")?.scrollIntoView({ behavior: "smooth" }),
        variant: "secondary",
      },
      features: [
        { icon: <Sparkles className="w-5 h-5" />, label: "Traits" },
        { icon: <Star className="w-5 h-5" />, label: "Stories" },
      ],
    },
    {
      id: "interactive",
      title: "Build Interactive Personalities.",
      subtitle: "Design behavioral patterns and response mechanisms.",
      description: "Set dynamic traits, interaction styles, and decision-making patterns for immersive experiences.",
      image: "/images/ora-hero-clean.png",
      primaryCta: {
        text: "Explore Features",
        action: onSearchClick,
        variant: "primary",
      },
      secondaryCta: {
        text: "View Examples",
        action: () => document.getElementById("aim-info")?.scrollIntoView({ behavior: "smooth" }),
        variant: "secondary",
      },
      features: [
        { icon: <Sparkles className="w-5 h-5" />, label: "Interactive" },
        { icon: <Star className="w-5 h-5" />, label: "Dynamic" },
      ],
    },
    {
      id: "export",
      title: "Export & Share Collection.",
      subtitle: "Generate MCP-compatible character data for any platform.",
      description: "Export your complete character profiles in industry-standard formats for use across applications.",
      image: "/images/ora-hero-clean.png",
      primaryCta: {
        text: "Get Started",
        action: onConnectedWalletClick,
        variant: "primary",
      },
      secondaryCta: {
        text: "View Format",
        action: onSearchClick,
        variant: "secondary",
      },
      features: [
        { icon: <Sparkles className="w-5 h-5" />, label: "Export" },
        { icon: <Star className="w-5 h-5" />, label: "Share" },
      ],
    },
  ]

  const changeSlide = (newSlide: number) => {
    if (newSlide === currentSlide || isTransitioning) return

    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(newSlide)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 200)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      changeSlide((currentSlide + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [currentSlide, slides.length])

  const nextSlide = () => {
    changeSlide((currentSlide + 1) % slides.length)
  }

  const prevSlide = () => {
    changeSlide((currentSlide - 1 + slides.length) % slides.length)
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-900 to-indigo-900 h-[600px] lg:h-[700px]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/ora-background-hero.png')",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20" />

      <div className="relative z-10 flex items-center h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="flex justify-end items-center h-full">
            <div
              className={`w-full max-w-2xl space-y-8 text-white transition-all duration-500 ease-out ${
                isTransitioning ? "opacity-0 transform translate-y-4" : "opacity-100 transform translate-y-0"
              }`}
            >
              <div className="flex gap-8 h-20 items-start justify-end">
                {currentSlideData.features?.map((feature, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center gap-3 transition-all duration-300 delay-${index * 100}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-teal-500/30">
                      {feature.icon}
                    </div>
                    <span className="text-sm text-cyan-200 font-semibold">{feature.label}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-6 min-h-[200px] flex flex-col justify-start text-right">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-cyan-300 via-teal-300 to-green-300 bg-clip-text text-transparent transition-all duration-500 ease-out">
                  {currentSlideData.title}
                </h1>

                <p className="text-xl lg:text-2xl text-white font-medium leading-relaxed transition-all duration-500 ease-out">
                  {currentSlideData.subtitle}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 min-h-[64px] justify-end">
                <Button
                  onClick={currentSlideData.primaryCta.action}
                  className="h-16 px-10 text-lg font-bold bg-gradient-to-r from-green-400 to-cyan-400 hover:from-green-500 hover:to-cyan-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-full"
                >
                  {currentSlideData.primaryCta.text}
                </Button>

                <Button
                  onClick={currentSlideData.secondaryCta.action}
                  className="h-16 px-10 text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-full"
                >
                  {currentSlideData.secondaryCta.text}
                </Button>
              </div>

              <div className="min-h-[60px] flex items-start justify-end">
                <p className="text-lg text-white leading-relaxed max-w-xl transition-all duration-500 ease-out text-right">
                  {currentSlideData.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => changeSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-cyan-400 shadow-lg shadow-cyan-400/50 scale-125"
                : "bg-white/30 hover:bg-white/50 hover:scale-110"
            }`}
          />
        ))}
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 z-20 hover:scale-110"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 z-20 hover:scale-110"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  )
}
