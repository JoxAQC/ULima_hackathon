'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, BarChart3, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/user-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/missions', icon: ListChecks, label: 'Missions' },
  { href: '/impact', icon: BarChart3, label: 'Impact' },
  { href: '/profile', icon: UserIcon, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const getLabel = (label: string, forTooltip: boolean = false) => {
    if (label === 'Home') {
      return user?.segment === 'Youth' ? 'My Village' : 'Home';
    }
    if (label === 'Missions') {
      return user?.segment === 'Youth' ? 'Learn' : 'Missions';
    }
    return label;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-lg items-center justify-around">
        <TooltipProvider>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/missions' && pathname.startsWith('/missions'));
            const finalLabel = getLabel(item.label);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{finalLabel}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getLabel(item.label, true)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>
    </footer>
  );
}
