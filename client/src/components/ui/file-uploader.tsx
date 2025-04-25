import { useRef, useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, File, AlertTriangle } from "lucide-react";

interface FileUploaderProps {
  accept?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  onFilesChanged: (files: File[]) => void;
  description?: string;
}

export function FileUploader({
  accept = "*/*",
  maxSize = 5,
  maxFiles = 1,
  onFilesChanged,
  description = "Arraste e solte arquivos aqui ou clique para selecionar"
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const validateFiles = (fileList: File[]): boolean => {
    // Check number of files
    if (fileList.length > maxFiles) {
      setError(`Você só pode enviar até ${maxFiles} arquivo${maxFiles !== 1 ? 's' : ''}`);
      return false;
    }
    
    // Check file types
    if (accept !== "*/*") {
      const acceptedTypes = accept.split(",").map(type => type.trim());
      const hasInvalidFile = fileList.some(file => {
        // Check if file extension or mime type matches any of the accepted types
        return !acceptedTypes.some(type => {
          if (type.startsWith(".")) {
            // Check file extension
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          } else {
            // Check mime type (may include wildcards like image/*)
            const [typeCategory, typeSubCategory] = type.split("/");
            const [fileCategory, fileSubCategory] = file.type.split("/");
            
            if (typeSubCategory === "*") {
              return fileCategory === typeCategory;
            }
            return file.type === type;
          }
        });
      });
      
      if (hasInvalidFile) {
        setError(`Tipo de arquivo não suportado. Use: ${accept}`);
        return false;
      }
    }
    
    // Check file sizes
    const maxSizeBytes = maxSize * 1024 * 1024;
    const hasOversizedFile = fileList.some(file => file.size > maxSizeBytes);
    
    if (hasOversizedFile) {
      setError(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      
      if (validateFiles(fileList)) {
        setFiles(fileList);
        onFilesChanged(fileList);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    if (e.dataTransfer.files) {
      const fileList = Array.from(e.dataTransfer.files);
      
      if (validateFiles(fileList)) {
        setFiles(fileList);
        onFilesChanged(fileList);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesChanged(newFiles);
    setError(null);
  };

  const clearFiles = () => {
    setFiles([]);
    onFilesChanged([]);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-md p-6
          ${isDragging ? 'border-primary bg-primary-50' : 'border-neutral-300'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          text-center cursor-pointer hover:bg-neutral-50 transition-colors
        `}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleFileChange}
        />
        
        {files.length === 0 ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              {error ? (
                <AlertTriangle className="h-10 w-10 text-red-500" />
              ) : (
                <UploadCloud className="h-10 w-10 text-neutral-400" />
              )}
            </div>
            
            <div>
              {error ? (
                <p className="text-sm font-medium text-red-500">{error}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-neutral-700">{description}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {maxFiles > 1 ? `Até ${maxFiles} arquivos` : 'Um arquivo'} (máx. {maxSize}MB cada)
                    {accept !== "*/*" && ` • Tipos: ${accept}`}
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-white p-3 rounded-md border border-neutral-200"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center">
                  <File className="h-5 w-5 text-neutral-500 mr-2" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-neutral-700 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-neutral-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {maxFiles > 1 && files.length < maxFiles && (
              <Button
                variant="outline"
                className="w-full mt-2"
                size="sm"
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Adicionar mais arquivos
              </Button>
            )}
          </div>
        )}
      </div>
      
      {files.length > 0 && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              clearFiles();
            }}
          >
            Limpar arquivos
          </Button>
        </div>
      )}
    </div>
  );
}