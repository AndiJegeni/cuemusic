import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export default function SidebarButton({ href, icon, label }: SidebarButtonProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
        isActive ? 'bg-gray-50 text-gray-700' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="text-base">{label}</span>
    </Link>
  );
} 