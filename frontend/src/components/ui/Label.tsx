import React from 'react'
import { cn } from '../../lib/cn'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label: React.FC<LabelProps> = ({
  children,
  className,
  required,
  ...props
}) => {
  return (
    <label
      className={cn(
        'block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

export default Label
