import React from 'react'
import { cn } from '../../lib/cn'

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className="w-full overflow-x-auto">
    <table
      className={cn('w-full text-left text-sm text-slate-700 dark:text-slate-200', className)}
      {...props}
    >
      {children}
    </table>
  </div>
)

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className,
  ...props
}) => (
  <thead
    className={cn(
      'bg-slate-50 dark:bg-slate-800/60 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800',
      className
    )}
    {...props}
  >
    {children}
  </thead>
)

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className,
  ...props
}) => (
  <tbody className={cn('divide-y divide-slate-100 dark:divide-slate-800', className)} {...props}>
    {children}
  </tbody>
)

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className,
  ...props
}) => (
  <tr
    className={cn('hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors', className)}
    {...props}
  >
    {children}
  </tr>
)

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className,
  ...props
}) => (
  <td className={cn('py-3 px-4', className)} {...props}>
    {children}
  </td>
)

export default Table
