import logo from "@/assets/ipayx-logo-new.png";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "h-20" }: LogoProps) {
  return (
    <img 
      src={logo} 
      alt="iPAYX Protocol" 
      className={className}
      loading="lazy"
    />
  );
}