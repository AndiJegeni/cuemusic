'use client';

interface ButtonProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  href: string;
}

const Button = ({ icon, children, href }: ButtonProps) => {
  return (
    <a
      href={href}
      className="flex items-center gap-3 w-full bg-gray-100 text-gray-600 hover:text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
    >
      {icon}
      <span className="text-sm font-medium">{children}</span>
    </a>
  );
};

export default Button;
