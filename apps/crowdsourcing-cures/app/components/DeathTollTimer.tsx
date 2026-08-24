"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const DEATHS_PER_SECOND = 1.736 // 150,000 deaths per day = 1.736 per second
const MAX_VISIBLE_SKULLS = 1000 // Increased for more impact
const SKULL_SIZE = 48 // Size of skull emoji in pixels
const FALL_DURATION = 3 // Duration of fall animation in seconds
const LOCAL_STORAGE_KEY = 'dfda-death-toll-dismissed'

// Text shadow for creating border effect
const textBorderStyle = {
  textShadow: `
    -2px -2px 0 #000,  
     2px -2px 0 #000,
    -2px  2px 0 #000,
     2px  2px 0 #000
  `
}

interface SkullPosition {
  id: number
  x: number
  y: number
  rotation: number
}

export default function DeathTollTimer() {
  const [deathCount, setDeathCount] = useState(0)
  const [startTime] = useState(Date.now())
  const [skullPositions, setSkullPositions] = useState<SkullPosition[]>([])
  const [isVisible, setIsVisible] = useState(false) // Start with false
  const containerRef = useRef<HTMLDivElement>(null)
  const [windowHeight, setWindowHeight] = useState(0)

  // Check local storage on mount
  useEffect(() => {
    const isDismissed = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!isDismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true')
  }

  // Update window height on mount and resize
  useEffect(() => {
    const updateHeight = () => setWindowHeight(window.innerHeight)
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Function to get a random x position within container width
  const getRandomXPosition = (containerWidth: number) => {
    return Math.random() * (containerWidth - SKULL_SIZE)
  }

  // Function to calculate y position based on existing skulls
  const getYPosition = (x: number, positions: SkullPosition[]) => {
    const nearbySkulls = positions.filter(
      pos => Math.abs(pos.x - x) < SKULL_SIZE * 0.8
    )
    if (nearbySkulls.length === 0) return windowHeight - SKULL_SIZE
    
    // Find the highest (smallest y value) nearby skull and stack on top
    const highestY = Math.min(...nearbySkulls.map(s => s.y))
    return Math.max(0, highestY - SKULL_SIZE * 0.8) // Allow some overlap
  }

  useEffect(() => {
    if (!isVisible || !containerRef.current || !windowHeight) return

    const timer = setInterval(() => {
      const secondsElapsed = (Date.now() - startTime) / 1000
      const newDeathCount = Math.floor(secondsElapsed * DEATHS_PER_SECOND)
      
      if (newDeathCount > deathCount) {
        setDeathCount(newDeathCount)
        
        // Add new skulls with positions
        const containerWidth = containerRef.current?.clientWidth || 1200

        setSkullPositions(prev => {
          const newPositions = [...prev]
          for (let i = deathCount; i < newDeathCount; i++) {
            const x = getRandomXPosition(containerWidth)
            const y = getYPosition(x, newPositions)
            const rotation = Math.random() * 40 - 20 // Random rotation between -20 and 20 degrees
            newPositions.push({ id: i, x, y, rotation })
          }
          return newPositions.slice(-MAX_VISIBLE_SKULLS)
        })
      }
    }, 100)

    return () => clearInterval(timer)
  }, [startTime, deathCount, isVisible, windowHeight])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Black Background */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Close Button */}
      <motion.button
        className="absolute right-8 top-8 z-20 text-4xl font-bold text-white transition-colors hover:text-red-600"
        onClick={handleDismiss}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        ✕
      </motion.button>

      {/* Main Content */}
      <div className="relative flex h-full items-center justify-center">
        {/* Centered Text Content */}
        <div className="z-10 flex flex-col items-center gap-1 text-center">
          <motion.span 
            className="text-9xl font-black text-red-600"
            style={textBorderStyle}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {deathCount.toLocaleString()}
          </motion.span>
          <motion.div 
            className="text-5xl font-black text-white"
            style={textBorderStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            PEOPLE HAVE DIED
          </motion.div>
          <motion.div 
            className="mt-2 text-center text-2xl font-bold text-white/60"
            style={textBorderStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            SINCE YOU STARTED READING THIS, BECAUSE CLINICAL RESEARCH IS
          </motion.div>
          <motion.div 
            className="flex flex-col items-center gap-0.5 text-4xl font-black text-red-600"
            style={textBorderStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <span>SLOW</span>
            <span>EXPENSIVE</span>
            <div className="flex items-center gap-2">
              <span className="text-white/60">and</span>
              <span>IMPRECISE</span>
            </div>
          </motion.div>

          {/* Dismiss Button */}
          <motion.button
            className="mt-2 border-2 border-white bg-black px-16 py-4 text-2xl font-bold text-white transition-colors hover:bg-red-600 hover:border-red-600 hover:text-white"
            onClick={handleDismiss}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            FIX IT
          </motion.button>
        </div>

        {/* Skulls Container - Full width */}
        <div 
          ref={containerRef}
          className="absolute inset-0 overflow-hidden"
        >
          <div className="relative h-full w-full">
            <AnimatePresence>
              {skullPositions.map((skull) => (
                <motion.div
                  key={skull.id}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: skull.x,
                    y: -SKULL_SIZE,
                    rotate: skull.rotation
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: skull.x,
                    y: skull.y,
                    rotate: skull.rotation
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ 
                    duration: FALL_DURATION,
                    ease: "linear",
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 }
                  }}
                  className="absolute flex items-center justify-center text-3xl"
                  style={{ width: SKULL_SIZE, height: SKULL_SIZE }}
                >
                  ☠️
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
} 