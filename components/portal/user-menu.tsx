'use client';

import { LogOut, Award, LayoutDashboard, UserRound, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function UserMenu({
  name,
  email,
  salon,
  onLogout,
  admin = false,
}: {
  name: string;
  email: string;
  salon: string;
  onLogout: () => Promise<void>;
  admin?: boolean;
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2.5 pl-2 pr-3 h-10">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-[11px] text-muted-foreground">{salon}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{name}</span>
            <span className="text-xs font-normal text-muted-foreground">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {admin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <LayoutDashboard /> Overview
            </Link>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <LayoutDashboard /> Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/certificates" className="cursor-pointer">
                <Award /> Certificates
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account" className="cursor-pointer">
                <UserRound /> My account
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/change-password" className="cursor-pointer">
            <KeyRound /> Change password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void onLogout()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
