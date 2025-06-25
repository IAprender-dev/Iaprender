import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, User, Mail, Phone, MapPin, BookOpen, Users, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Constantes do Sistema de Design IAverse
export const FORM_THEME = {
  colors: {
    primary: {
      gradient: 'from-blue-600 to-purple-600',
      solid: 'blue-600',
      hover: 'from-blue-700 to-purple-700',
      light: 'from-blue-50/80 to-indigo-50/80',
      border: 'blue-200/60'
    },
    secondary: {
      gradient: 'from-purple-600 to-indigo-600',
      solid: 'purple-600',
      hover: 'from-purple-700 to-indigo-700',
      light: 'from-purple-50/80 to-pink-50/80',
      border: 'purple-200/60'
    },
    success: {
      gradient: 'from-green-600 to-emerald-600',
      solid: 'green-600',
      hover: 'from-green-700 to-emerald-700',
      light: 'from-green-50/80 to-emerald-50/80',
      border: 'green-200/60'
    },
    warning: {
      gradient: 'from-yellow-600 to-orange-600',
      solid: 'yellow-600',
      hover: 'from-yellow-700 to-orange-700',
      light: 'from-yellow-50/80 to-orange-50/80',
      border: 'yellow-200/60'
    },
    danger: {
      gradient: 'from-red-600 to-pink-600',
      solid: 'red-600',
      hover: 'from-red-700 to-pink-700',
      light: 'from-red-50/80 to-pink-50/80',
      border: 'red-200/60'
    }
  },
  typography: {
    title: 'text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent text-center',
    subtitle: 'text-slate-600 font-medium text-center text-lg',
    sectionTitle: 'text-xl font-bold text-slate-700 mb-6 flex items-center gap-3',
    label: 'text-slate-800 font-bold text-sm tracking-wide uppercase',
    placeholder: 'text-slate-600',
    helper: 'text-slate-500 text-sm mt-1'
  },
  spacing: {
    container: 'space-y-6 px-2',
    section: 'space-y-4',
    field: 'space-y-2',
    grid: 'grid gap-4'
  },
  effects: {
    backdrop: 'bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl',
    card: 'bg-gradient-to-br rounded-xl p-6 border shadow-lg',
    input: 'rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium',
    button: 'rounded-2xl h-14 font-bold text-base px-8 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl',
    icon: 'w-8 h-8 bg-gradient-to-r rounded-full flex items-center justify-center'
  }
};

// Mapeamento de ícones para diferentes tipos de campos
export const FIELD_ICONS = {
  user: User,
  email: Mail,
  phone: Phone,
  address: MapPin,
  education: BookOpen,
  role: Users,
  academic: GraduationCap,
  calendar: CalendarIcon
};

// Componentes do Template
export const FormContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={cn(FORM_THEME.effects.backdrop, 'sm:max-w-4xl max-h-[95vh] overflow-y-auto', className)}>
    {children}
  </div>
);

export const FormHeader: React.FC<{ 
  title: string; 
  description: string; 
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' 
}> = ({ 
  title, 
  description, 
  colorScheme = 'primary' 
}) => (
  <div className="space-y-4 pb-6 pt-2">
    <h1 className={cn(FORM_THEME.typography.title, FORM_THEME.colors[colorScheme].gradient)}>
      {title}
    </h1>
    <p className={FORM_THEME.typography.subtitle}>
      {description}
    </p>
  </div>
);

export const FormSection: React.FC<{ 
  title: string; 
  icon: keyof typeof FIELD_ICONS;
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}> = ({ 
  title, 
  icon, 
  colorScheme = 'primary', 
  children 
}) => {
  const IconComponent = FIELD_ICONS[icon];
  
  return (
    <div className={cn(
      FORM_THEME.effects.card,
      FORM_THEME.colors[colorScheme].light,
      `border-${FORM_THEME.colors[colorScheme].border}`
    )}>
      <h3 className={FORM_THEME.typography.sectionTitle}>
        <div className={cn(
          FORM_THEME.effects.icon,
          FORM_THEME.colors[colorScheme].gradient
        )}>
          <IconComponent className="h-4 w-4 text-white" />
        </div>
        {title}
      </h3>
      <div className={FORM_THEME.spacing.section}>
        {children}
      </div>
    </div>
  );
};

export const FormField: React.FC<{
  label: string;
  required?: boolean;
  helper?: string;
  children: React.ReactNode;
}> = ({ label, required = false, helper, children }) => (
  <div className={FORM_THEME.spacing.field}>
    <Label className={FORM_THEME.typography.label}>
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
    {helper && <p className={FORM_THEME.typography.helper}>{helper}</p>}
  </div>
);

export const TemplateInput: React.FC<{
  placeholder: string;
  icon?: keyof typeof FIELD_ICONS;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}> = ({ 
  placeholder, 
  icon, 
  type = 'text', 
  value, 
  onChange, 
  colorScheme = 'primary' 
}) => {
  const IconComponent = icon ? FIELD_ICONS[icon] : null;
  
  return (
    <div className="relative">
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          FORM_THEME.effects.input,
          icon ? 'pl-14' : '',
          `focus:border-${FORM_THEME.colors[colorScheme].solid}`,
          `focus:ring-${FORM_THEME.colors[colorScheme].solid}/20`
        )}
      />
      {IconComponent && (
        <div className={cn(
          "absolute left-4 top-1/2 transform -translate-y-1/2",
          FORM_THEME.effects.icon.replace('w-8 h-8', 'w-6 h-6'),
          FORM_THEME.colors[colorScheme].gradient
        )}>
          <IconComponent className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};

export const TemplateSelect: React.FC<{
  placeholder: string;
  icon?: keyof typeof FIELD_ICONS;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}> = ({ 
  placeholder, 
  icon, 
  value, 
  onValueChange, 
  children, 
  colorScheme = 'primary' 
}) => {
  const IconComponent = icon ? FIELD_ICONS[icon] : null;
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn(
        FORM_THEME.effects.input,
        `focus:border-${FORM_THEME.colors[colorScheme].solid}`,
        `focus:ring-${FORM_THEME.colors[colorScheme].solid}/20`
      )}>
        <div className="flex items-center space-x-3">
          {IconComponent && (
            <div className={cn(
              FORM_THEME.effects.icon.replace('w-8 h-8', 'w-6 h-6'),
              FORM_THEME.colors[colorScheme].gradient
            )}>
              <IconComponent className="w-4 h-4 text-white" />
            </div>
          )}
          <SelectValue placeholder={placeholder} className={FORM_THEME.typography.placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
        {children}
      </SelectContent>
    </Select>
  );
};

export const TemplateTextarea: React.FC<{
  placeholder: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}> = ({ 
  placeholder, 
  value, 
  onChange, 
  rows = 4, 
  colorScheme = 'primary' 
}) => (
  <Textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={cn(
      'rounded-2xl border-2 border-slate-200 transition-all duration-300 text-base p-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium resize-none',
      `focus:border-${FORM_THEME.colors[colorScheme].solid}`,
      `focus:ring-${FORM_THEME.colors[colorScheme].solid}/20 focus:ring-4`
    )}
  />
);

export const TemplateDatePicker: React.FC<{
  placeholder: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}> = ({ 
  placeholder, 
  value, 
  onChange, 
  colorScheme = 'primary' 
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn(
          FORM_THEME.effects.input,
          'justify-start text-left font-normal',
          !value && 'text-slate-500',
          `focus:border-${FORM_THEME.colors[colorScheme].solid}`,
          `hover:border-${FORM_THEME.colors[colorScheme].solid}`
        )}
      >
        <div className="flex items-center space-x-3">
          <div className={cn(
            FORM_THEME.effects.icon.replace('w-8 h-8', 'w-6 h-6'),
            FORM_THEME.colors[colorScheme].gradient
          )}>
            <CalendarIcon className="w-4 h-4 text-white" />
          </div>
          <span>
            {value 
              ? format(value, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : placeholder
            }
          </span>
        </div>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
      <Calendar
        mode="single"
        selected={value}
        onSelect={onChange}
        locale={ptBR}
        className="rounded-2xl"
      />
    </PopoverContent>
  </Popover>
);

export const TemplateCheckbox: React.FC<{
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}> = ({ 
  label, 
  checked, 
  onChange, 
  colorScheme = 'primary' 
}) => (
  <div className="flex items-center space-x-3 p-4 bg-white/50 rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-300">
    <Checkbox
      checked={checked}
      onCheckedChange={onChange}
      className={cn(
        'w-5 h-5 rounded-lg',
        `data-[state=checked]:bg-${FORM_THEME.colors[colorScheme].solid}`,
        `data-[state=checked]:border-${FORM_THEME.colors[colorScheme].solid}`
      )}
    />
    <Label className="text-slate-700 font-medium cursor-pointer">
      {label}
    </Label>
  </div>
);

export const TemplateButton: React.FC<{
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  size = 'lg', 
  disabled = false, 
  onClick, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-10 px-6 text-sm',
    md: 'h-12 px-8 text-base',
    lg: 'h-14 px-10 text-lg'
  };

  const variantClasses = {
    primary: `bg-gradient-to-r ${FORM_THEME.colors.primary.gradient} hover:${FORM_THEME.colors.primary.hover} text-white`,
    secondary: `bg-gradient-to-r ${FORM_THEME.colors.secondary.gradient} hover:${FORM_THEME.colors.secondary.hover} text-white`,
    success: `bg-gradient-to-r ${FORM_THEME.colors.success.gradient} hover:${FORM_THEME.colors.success.hover} text-white`,
    warning: `bg-gradient-to-r ${FORM_THEME.colors.warning.gradient} hover:${FORM_THEME.colors.warning.hover} text-white`,
    danger: `bg-gradient-to-r ${FORM_THEME.colors.danger.gradient} hover:${FORM_THEME.colors.danger.hover} text-white`,
    outline: 'border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-700',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700'
  };

  return (
    <Button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        FORM_THEME.effects.button,
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
        className
      )}
    >
      {children}
    </Button>
  );
};

export const FormActions: React.FC<{
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
}> = ({ children, align = 'center' }) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={cn('flex gap-4 pt-6 border-t border-slate-200', alignClasses[align])}>
      {children}
    </div>
  );
};

// Layouts de grid para formulários responsivos
export const FormGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 2 | 3 | 4 | 6 | 8;
}> = ({ children, columns = 2, gap = 4 }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  };

  return (
    <div className={cn('grid', gridClasses[columns], gapClasses[gap])}>
      {children}
    </div>
  );
};