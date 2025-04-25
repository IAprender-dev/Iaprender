import { Category } from "@/lib/types";
import { Link } from "wouter";
import { LucideIcon } from "lucide-react";

interface CourseCategoryProps {
  category: Category;
  icon?: LucideIcon;
}

export default function CourseCategory({ category, icon: Icon }: CourseCategoryProps) {
  return (
    <Link
      href={`/cursos/categoria/${category.id}`}
      className="bg-white border border-neutral-200 rounded-lg p-4 text-center hover:border-primary-300 hover:shadow-sm transition-all duration-300"
    >
      <div className="bg-primary-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
        {Icon ? (
          <Icon className="text-primary" />
        ) : (
          <span className="text-primary text-xl" dangerouslySetInnerHTML={{ __html: category.icon }} />
        )}
      </div>
      <span className="text-sm font-medium text-neutral-700">{category.name}</span>
    </Link>
  );
}
