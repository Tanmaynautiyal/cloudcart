import React from 'react'
import { Wrench, RefreshCw, ArrowLeft, Shield } from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'
import { Button } from '../../components/ui/Button'

export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="flex justify-center">
          <BrandLogo />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#EF233C] flex items-center justify-center mx-auto">
          <Wrench size={32} />
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            System Maintenance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            We are performing scheduled infrastructure upgrades to enhance catalog latency and payment reliability. CloudCart will return shortly.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Estimated Completion: Within 30 minutes</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.location.reload()}
            leftIcon={<RefreshCw size={14} />}
          >
            Check Status
          </Button>
          <Button
            className="flex-1 bg-[#EF233C] hover:bg-[#D90429] text-white"
            onClick={() => (window.location.href = '/')}
            leftIcon={<ArrowLeft size={14} />}
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MaintenancePage
