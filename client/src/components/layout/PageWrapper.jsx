import { motion } from 'framer-motion'
import { useEffect } from 'react'

import { cn } from '../../utils/cn'

function PageWrapper({ title, className, children }) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ElectroMap`
      return
    }

    document.title = 'ElectroMap'
  }, [title])

  return (
    <motion.main
      className={cn(className)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}
    >
      {children}
    </motion.main>
  )
}

export default PageWrapper
