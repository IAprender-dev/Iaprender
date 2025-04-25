import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

interface CertificateGeneratorProps {
  certificateData: {
    studentName: string;
    courseName: string;
    issueDate: string;
    teacherName: string;
  };
}

export default function CertificateGenerator({ certificateData }: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
  });

  const handleDownload = () => {
    const svgData = new XMLSerializer().serializeToString(certificateRef.current?.querySelector('svg') as SVGElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `certificado-${certificateData.studentName.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={certificateRef} 
        className="w-full max-w-4xl p-4 bg-white shadow-lg rounded-lg my-4"
      >
        <svg
          viewBox="0 0 800 600"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          {/* Certificate Border */}
          <rect
            x="20"
            y="20"
            width="760"
            height="560"
            fill="white"
            stroke="#3563E9"
            strokeWidth="8"
            rx="15"
            ry="15"
          />
          <rect
            x="30"
            y="30"
            width="740"
            height="540"
            fill="white"
            stroke="#34C759"
            strokeWidth="2"
            rx="10"
            ry="10"
            strokeDasharray="5,5"
          />

          {/* Header */}
          <text
            x="400"
            y="80"
            fontFamily="Poppins, sans-serif"
            fontSize="40"
            fontWeight="bold"
            textAnchor="middle"
            fill="#3563E9"
          >
            CERTIFICADO
          </text>

          {/* Logo */}
          <g transform="translate(370, 120)">
            <text
              x="0"
              y="0"
              fontFamily="Poppins, sans-serif"
              fontSize="32"
              fontWeight="bold"
              textAnchor="middle"
              fill="#3563E9"
            >
              i
              <tspan fill="#34C759">Aula</tspan>
            </text>
          </g>

          {/* Main Text */}
          <text
            x="400"
            y="180"
            fontFamily="Inter, sans-serif"
            fontSize="16"
            textAnchor="middle"
            fill="#333"
          >
            Certificamos que
          </text>

          {/* Student Name */}
          <text
            x="400"
            y="230"
            fontFamily="Poppins, sans-serif"
            fontSize="30"
            fontWeight="bold"
            textAnchor="middle"
            fill="#333"
          >
            {certificateData.studentName}
          </text>

          {/* Course Description */}
          <text
            x="400"
            y="280"
            fontFamily="Inter, sans-serif"
            fontSize="16"
            textAnchor="middle"
            fill="#333"
          >
            concluiu com êxito o curso de
          </text>

          {/* Course Name */}
          <text
            x="400"
            y="320"
            fontFamily="Poppins, sans-serif"
            fontSize="24"
            fontWeight="bold"
            textAnchor="middle"
            fill="#3563E9"
          >
            {certificateData.courseName}
          </text>

          {/* Description */}
          <text
            x="400"
            y="370"
            fontFamily="Inter, sans-serif"
            fontSize="16"
            textAnchor="middle"
            fill="#333"
          >
            demonstrando dedicação e domínio do conteúdo
          </text>

          {/* Date */}
          <text
            x="400"
            y="420"
            fontFamily="Inter, sans-serif"
            fontSize="14"
            textAnchor="middle"
            fill="#333"
          >
            {formatDate(certificateData.issueDate)}
          </text>

          {/* Signature Line Teacher */}
          <line
            x1="220"
            y1="480"
            x2="380"
            y2="480"
            stroke="#333"
            strokeWidth="1"
          />
          <text
            x="300"
            y="500"
            fontFamily="Inter, sans-serif"
            fontSize="14"
            textAnchor="middle"
            fill="#333"
          >
            {certificateData.teacherName}
          </text>
          <text
            x="300"
            y="520"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            textAnchor="middle"
            fill="#666"
          >
            Instrutor
          </text>

          {/* Signature Line Platform */}
          <line
            x1="420"
            y1="480"
            x2="580"
            y2="480"
            stroke="#333"
            strokeWidth="1"
          />
          <text
            x="500"
            y="500"
            fontFamily="Inter, sans-serif"
            fontSize="14"
            textAnchor="middle"
            fill="#333"
          >
            iAula Educação
          </text>
          <text
            x="500"
            y="520"
            fontFamily="Inter, sans-serif"
            fontSize="12"
            textAnchor="middle"
            fill="#666"
          >
            Plataforma Educacional
          </text>

          {/* Decorative Elements */}
          <circle cx="70" cy="70" r="30" fill="#3563E9" fillOpacity="0.1" />
          <circle cx="730" cy="70" r="30" fill="#34C759" fillOpacity="0.1" />
          <circle cx="70" cy="530" r="30" fill="#34C759" fillOpacity="0.1" />
          <circle cx="730" cy="530" r="30" fill="#3563E9" fillOpacity="0.1" />
        </svg>
      </div>
      
      <div className="flex space-x-4 mt-4">
        <Button 
          variant="outline" 
          onClick={handlePrint}
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Imprimir Certificado
        </Button>
        <Button 
          onClick={handleDownload}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Baixar Certificado
        </Button>
      </div>
    </div>
  );
}
