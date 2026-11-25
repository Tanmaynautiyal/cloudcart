import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'
import BrandLogo from '../../components/common/BrandLogo'
import { Button } from '../../components/ui/Button'
import { PATHS } from '../../routes/routes'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="flex justify-center">
          <BrandLogo />
        </div>

        <div className="text-6xl font-black text-[#EF233C] tracking-tighter">
          404
        </div>

        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            The page you are looking for might have been moved, renamed, or is temporarily unavailable in the CloudCart network.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft size={14} />}
          >
            Go Back
          </Button>
          <Link to={PATHS.HOME} className="flex-1">
            <Button
              className="w-full bg-[#EF233C] hover:bg-[#D90429] text-white"
              leftIcon={<Home size={14} />}
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
