import { motion } from 'framer-motion'

import { cn } from '../../utils/cn'

const containerVariants = {
  hidden: {},
  visible: (delay) => ({
    transition: {
      staggerChildren: 0.09,
      delayChildren: delay,
    },
  }),
}

const wordVariants = {
  hidden: {
    opacity: 0,
    y: 26,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.2, 0.9, 0.2, 1],
    },
  },
}

function SplitText({ text, className, as: Tag = 'h1', delay = 0 }) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)

  return (
    <Tag className={cn(className)}>
      <motion.span
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        custom={delay}
        style={{ display: 'inline-block' }}
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              paddingRight: '0.22em',
            }}
          >
            <motion.span variants={wordVariants} style={{ display: 'inline-block' }}>
              {word}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}

export default SplitText
