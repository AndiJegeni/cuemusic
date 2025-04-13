'use client';

interface ButtonProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  href: string;
  className?: string;
}

const Button = ({ icon, children, href, className }: ButtonProps) => {
  return (
    <a
      href={href}
      className={className || "flex items-center gap-3 w-full bg-[#3C3C3E] text-gray-300 hover:text-white py-3 px-4 rounded-lg hover:bg-[#4C4C4E] transition-colors"}
    >
      {icon}
      <span className="text-sm font-medium">{children}</span>
    </a>
  );
};

export default Button;
