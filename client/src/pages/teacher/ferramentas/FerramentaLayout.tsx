import { ReactNode } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { ArrowLeft, HelpCircle } from "lucide-react";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";
import TeacherHeader from "@/components/dashboard/teacher/TeacherHeader";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FerramentaLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  icon: ReactNode;
  helpText?: string;
}

export default function FerramentaLayout({ 
  children, 
  title, 
  description,
  icon,
  helpText
}: FerramentaLayoutProps) {
  return (
    <>
      <Helmet>
        <title>{title} | IAverse</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TeacherHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              {/* Breadcrumb and back button */}
              <div className="flex items-center mb-6">
                <Link href="/professor/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1 text-neutral-600 hover:text-blue-600">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar ao Dashboard</span>
                  </Button>
                </Link>
              </div>

              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center">
                  <div className="bg-blue-50 rounded-full p-3 mr-4">
                    {icon}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
                    <p className="text-neutral-600">{description}</p>
                  </div>
                </div>
                
                {helpText && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <HelpCircle className="h-4 w-4" />
                          <span>Ajuda</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>{helpText}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Content */}
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}