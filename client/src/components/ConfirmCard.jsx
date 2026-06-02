import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, X } from 'lucide-react';

export default function ConfirmCard({ 
  message, 
  onConfirm, 
  onCancel, 
  confirmLabel = 'Ya', 
  cancelLabel = 'Batal',
  type = 'warning' 
}) {
  const iconConfig = {
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
    error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    success: { icon: Check, color: 'text-green-500', bg: 'bg-green-50' },
    info: { icon: X, color: 'text-blue-500', bg: 'bg-blue-50' },
  };

  const config = iconConfig[type] || iconConfig.warning;
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      <motion.div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />

      
      <motion.div 
        className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full overflow-hidden"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        
        <div className={`${config.bg} w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto`}>
          <IconComponent className={`${config.color} w-7 h-7`} />
        </div>

        
        <p className="text-gray-700 text-center mb-6 font-medium leading-relaxed">
          {message}
        </p>

        
        <div className="flex justify-center gap-3">
          <motion.button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:border-red-300 hover:bg-red-50 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {cancelLabel}
          </motion.button>

          <motion.button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
