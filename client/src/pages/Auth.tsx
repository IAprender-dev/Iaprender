import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogoWithText } from "@/components/ui/logo";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["teacher", "student"]),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Auth() {
  const [activeTab, setActiveTab] = useState("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Verificar parâmetros URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("register") === "true") {
      setActiveTab("register");
    }
  }, []);

  // Se já estiver autenticado, redirecionar para a página inicial
  useEffect(() => {
    if (user) {
      if (user.role === "teacher") {
        navigate("/professor/dashboard");
      } else if (user.role === "student") {
        navigate("/aluno/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "student",
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      ...values,
      username: values.email.split("@")[0], // Usar primeira parte do email como nome de usuário
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <LogoWithText textSize="md" />
          </a>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Coluna com formulário de autenticação */}
        <div className="flex-1 flex justify-center items-center p-4">
          <div className="w-full max-w-md">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Cadastro</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Card>
                    <CardHeader>
                      <CardTitle>Login</CardTitle>
                      <CardDescription>
                        Acesse sua conta usando seu email e senha.
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            {...loginForm.register("email")} 
                          />
                          {loginForm.formState.errors.email && (
                            <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password">Senha</Label>
                            <a href="#" className="text-sm text-primary hover:underline">
                              Esqueceu a senha?
                            </a>
                          </div>
                          <Input 
                            id="password" 
                            type="password"
                            {...loginForm.register("password")} 
                          />
                          {loginForm.formState.errors.password && (
                            <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                          {loginMutation.isPending ? "Entrando..." : "Entrar"}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>

                <TabsContent value="register">
                  <Card>
                    <CardHeader>
                      <CardTitle>Crie sua conta</CardTitle>
                      <CardDescription>
                        Preencha os campos abaixo para se cadastrar.
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Nome</Label>
                            <Input 
                              id="firstName"
                              {...registerForm.register("firstName")} 
                            />
                            {registerForm.formState.errors.firstName && (
                              <p className="text-sm text-destructive">{registerForm.formState.errors.firstName.message}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Sobrenome</Label>
                            <Input 
                              id="lastName"
                              {...registerForm.register("lastName")} 
                            />
                            {registerForm.formState.errors.lastName && (
                              <p className="text-sm text-destructive">{registerForm.formState.errors.lastName.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email"
                            type="email"
                            {...registerForm.register("email")} 
                          />
                          {registerForm.formState.errors.email && (
                            <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Senha</Label>
                          <Input 
                            id="password" 
                            type="password"
                            {...registerForm.register("password")} 
                          />
                          {registerForm.formState.errors.password && (
                            <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Eu sou</Label>
                          <div className="flex gap-4">
                            <label className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                value="student"
                                {...registerForm.register("role")}
                                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                              />
                              <span>Aluno</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                value="teacher"
                                {...registerForm.register("role")}
                                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                              />
                              <span>Professor</span>
                            </label>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                          {registerMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Coluna com texto inspirador e imagem */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-foreground to-primary/5 p-12">
          <div className="max-w-lg mx-auto flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-6">
              Revolucione seu aprendizado com IA
            </h1>
            <p className="text-lg mb-8 text-muted-foreground">
              O iAula é uma plataforma educacional que combina o melhor da tecnologia de inteligência artificial com métodos pedagógicos comprovados, projetada para transformar a maneira como professores ensinam e alunos aprendem.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                <h3 className="font-medium mb-2">Para Professores</h3>
                <p className="text-sm text-muted-foreground">Crie planos de aula, atividades e avaliações em minutos com a ajuda de IA avançada.</p>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                <h3 className="font-medium mb-2">Para Alunos</h3>
                <p className="text-sm text-muted-foreground">Receba explicações personalizadas, resumos de conteúdo e prática adaptativa.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}