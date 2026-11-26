import {
  Briefcase,
  Camera,
  Car,
  GraduationCap,
  HardHat,
  HeartPulse,
  Home,
  Laptop,
  Layers,
  Scissors,
  ShieldCheck,
  Sprout,
  Utensils,
} from 'lucide-react';

const ICON_MAP = {
  HardHat,
  Home,
  Car,
  Scissors,
  GraduationCap,
  Laptop,
  Utensils,
  Sprout,
  Camera,
  HeartPulse,
  Briefcase,
  ShieldCheck,
  Layers,
} as const;

export function CategoryIcon({
  name,
  className = 'w-5 h-5',
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name as keyof typeof ICON_MAP] || Briefcase;
  return <Icon className={className} aria-hidden="true" />;
}
