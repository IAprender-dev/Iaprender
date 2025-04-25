import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { 
  Brain, 
  Calculator, 
  PenTool, 
  FlaskRound, 
  Landmark, 
  Languages 
} from "lucide-react";

interface CourseCardProps {
  image: string;
  category: string;
  rating: number;
  title: string;
  description: string;
  modules: number;
}

function CourseCard({ image, category, rating, title, description, modules }: CourseCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow border border-neutral-100 hover:shadow-lg transition-shadow duration-300">
      <div className="relative pb-[56.25%]">
        <img 
          src={image} 
          alt={title} 
          className="absolute h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-primary bg-primary-50 px-2 py-1 rounded-full">{category}</span>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF9500" className="w-3 h-3">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-neutral-600 ml-1">{rating.toFixed(1)}</span>
          </div>
        </div>
        <h4 className="font-semibold text-neutral-900 mb-1">{title}</h4>
        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-medium text-neutral-900">{modules} módulos</span>
          <Link
            href="/cursos"
            className="text-sm font-medium text-primary hover:text-primary/90"
          >
            Ver curso
          </Link>
        </div>
      </div>
    </div>
  );
}

interface CategoryProps {
  icon: React.ReactNode;
  name: string;
}

function Category({ icon, name }: CategoryProps) {
  return (
    <Link
      href="/cursos"
      className="bg-white border border-neutral-200 rounded-lg p-4 text-center hover:border-primary-300 hover:shadow-sm transition-all duration-300"
    >
      <div className="bg-primary-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <span className="text-sm font-medium text-neutral-700">{name}</span>
    </Link>
  );
}

export default function CoursesSection() {
  const featuredCourses: CourseCardProps[] = [
    {
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      category: "Tecnologia",
      rating: 4.9,
      title: "Inteligência Artificial na Educação",
      description: "Aprenda a implementar soluções de IA para otimizar o ambiente de aprendizagem.",
      modules: 8
    },
    {
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      category: "Matemática",
      rating: 4.7,
      title: "Matemática Aplicada",
      description: "Metodologias inovadoras para o ensino de matemática com exemplos práticos.",
      modules: 12
    },
    {
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      category: "Redação",
      rating: 4.8,
      title: "Técnicas de Redação",
      description: "Desenvolva habilidades para orientar seus alunos na produção de textos de qualidade.",
      modules: 6
    },
    {
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      category: "Pedagogia",
      rating: 4.9,
      title: "Gestão de Sala de Aula",
      description: "Estratégias eficazes para criar um ambiente de aprendizagem produtivo e engajador.",
      modules: 10
    }
  ];

  const categories: CategoryProps[] = [
    { icon: <Brain className="text-primary" />, name: "Inteligência Artificial" },
    { icon: <Calculator className="text-primary" />, name: "Matemática" },
    { icon: <PenTool className="text-primary" />, name: "Redação" },
    { icon: <FlaskRound className="text-primary" />, name: "Ciências" },
    { icon: <Landmark className="text-primary" />, name: "História" },
    { icon: <Languages className="text-primary" />, name: "Idiomas" }
  ];

  return (
    <section id="cursos" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 font-heading">Aprimore seus conhecimentos</h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-neutral-600">
            Nossos cursos e tutoriais são projetados para atender às necessidades educacionais do século XXI.
          </p>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-neutral-900 font-heading">Cursos em Destaque</h3>
            <Link 
              href="/cursos" 
              className="text-primary hover:text-primary/90 text-sm font-medium flex items-center"
            >
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCourses.map((course, index) => (
              <CourseCard
                key={index}
                image={course.image}
                category={course.category}
                rating={course.rating}
                title={course.title}
                description={course.description}
                modules={course.modules}
              />
            ))}
          </div>
          
          {/* Categories Section */}
          <div className="mt-16">
            <h3 className="text-xl font-semibold text-neutral-900 font-heading mb-6">Explore por Categoria</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <Category
                  key={index}
                  icon={category.icon}
                  name={category.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
