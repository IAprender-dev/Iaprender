import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface BackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export function BackButton({ href, label = "Voltar", className = "" }: BackButtonProps) {
  return (
    <Link href={href}>
      <Button className={`gap-3 h-12 px-6 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl ${className}`}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
}