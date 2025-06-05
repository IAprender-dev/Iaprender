import { Course } from "@/lib/types";
import { Link } from "wouter";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CourseCardProps {
  course: Course;
  variant?: "featured" | "standard";
}

export default function CourseCard({ course, variant = "standard" }: CourseCardProps) {
  const getStatusBadge = () => {
    if (!course.status) return null;
    
    switch (course.status) {
      case "in_progress":
        return (
          <Badge variant="default">
            Em andamento
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success">
            Concluído
          </Badge>
        );
      case "not_started":
        return (
          <Badge variant="warning">
            Novo
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg overflow-hidden shadow border border-neutral-100 hover:shadow-lg transition-shadow duration-300 ${variant === "featured" ? "flex flex-col md:flex-row" : ""}`}>
      <div className={`relative ${variant === "featured" ? "md:w-1/3" : "pb-[56.25%]"}`}>
        <img 
          src={course.imageUrl} 
          alt={course.title} 
          className={`${variant === "featured" ? "h-48 md:h-full w-full object-cover" : "absolute h-full w-full object-cover"}`}
        />
      </div>
      <div className={`p-4 ${variant === "featured" ? "md:w-2/3" : ""}`}>
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline" className="bg-primary-50 text-primary border-0 px-2 py-1 text-xs">
            {course.category}
          </Badge>
          <div className="flex items-center">
            <Star className="text-[#FF9500] w-4 h-4 fill-current" />
            <span className="text-xs text-neutral-600 ml-1">{course.rating.toFixed(1)}</span>
          </div>
        </div>
        <h4 className="font-semibold text-neutral-900 mb-1">{course.title}</h4>
        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{course.description}</p>
        
        {course.progress !== undefined && (
          <div className="mt-2 mb-3">
            <Progress value={course.progress} className="h-1.5" />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-neutral-500">{course.progress}% concluído</span>
              {course.status === "completed" && (
                <span className="text-xs text-[#34C759]">Finalizado</span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-medium text-neutral-900">{course.moduleCount} módulos</span>
          <div className="flex items-center">
            {getStatusBadge()}
            <Link 
              href={`/curso/${course.id}`} 
              className="ml-2 text-sm font-medium text-primary hover:text-primary/90"
            >
              {course.status === "in_progress" ? "Continuar" : "Ver curso"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
