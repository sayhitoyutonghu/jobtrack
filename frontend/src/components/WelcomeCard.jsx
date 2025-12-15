import React from 'react';
import { motion } from 'framer-motion';

const WelcomeCard = ({ onPlay }) => {
    return (
        <motion.div
            onClick={onPlay}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="
        cursor-pointer group relative w-full h-48 
        bg-white border-2 border-black border-dashed
        hover:border-solid hover:bg-green-400 transition-colors
        flex flex-col items-center justify-center text-center p-4
        shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]
        hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
      "
        >
            {/* Decorative Icon */}
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                👾
            </div>

            <h3 className="font-black text-xl uppercase tracking-tighter mb-1">
                DEMO MODE
            </h3>

            <p className="font-mono text-xs text-gray-600 group-hover:text-black mb-4">
                CLICK TO DEAL CARDS
            </p>

            {/* Button Appearance */}
            <div className="bg-black text-white px-3 py-1 text-[10px] font-bold font-mono uppercase">
                GENERATE MOCK JOBS
            </div>

        </motion.div>
    );
};

export default WelcomeCard;
