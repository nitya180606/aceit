import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        onAnimationComplete={() => setTimeout(onComplete, 2600)}
      >
        {/* Background radial glow */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)'
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-indigo-400/40"
            style={{
              top: `${20 + i * 12}%`,
              left: `${10 + i * 15}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 2 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo mark */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: 'backOut', delay: 0.2 }}
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <motion.span
                  className="text-white font-bold text-4xl"
                  style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  A
                </motion.span>
              </div>
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-indigo-400/50"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.7, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Brand name */}
          <div className="flex items-baseline gap-1 overflow-hidden">
            {'AceIt'.split('').map((char, i) => (
              <motion.span
                key={i}
                className="text-white text-5xl font-bold tracking-tight"
                style={{ fontFamily: "'Sora', sans-serif" }}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 0.8 + i * 0.07,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Caption */}
          <motion.p
            className="text-gray-400 text-base tracking-wide text-center font-light"
            style={{ fontFamily: "'Sora', sans-serif" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            Practice smarter. Interview better.{' '}
            <span className="text-indigo-400 font-medium">Get hired.</span>
          </motion.p>

          {/* Loading bar */}
          <motion.div
            className="mt-4 w-48 h-0.5 bg-gray-800 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 1.7, duration: 0.9, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}