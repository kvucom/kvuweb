import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  images: string[]
  interval?: number // ms, default 4000
  className?: string
  alt?: string
}

export default function StorySlideshow({ images, interval = 4000, className = '', alt = 'Story photo' }: Props) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length)
    }, interval)
    return () => clearInterval(timer)
  }, [images.length, interval])

  if (images.length === 0) return null

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence>
        <motion.img
          key={images[current]}
          src={images[current]}
          alt={alt}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="w-full h-full object-cover absolute inset-0"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=No+Image' }}
        />
      </AnimatePresence>

      {/* Invisible spacer to maintain aspect ratio - matches the img */}
      <img src={images[0]} alt="" loading="lazy" className="w-full h-full object-cover opacity-0 pointer-events-none" aria-hidden />

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? 'bg-white scale-125 shadow-md' : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
