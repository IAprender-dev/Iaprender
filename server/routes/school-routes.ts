import { Express, Request, Response } from "express";

export function registerSchoolRoutes(app: Express) {
  
  // Middleware para autenticação de diretor escolar
  const authenticateSchoolDirector = (req: Request, res: Response, next: Function) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (req.session.user.role !== 'school_director') {
      return res.status(403).json({ message: "Access denied: School director role required" });
    }
    
    next();
  };

  // Mock data
  const mockClasses = [
    {
      id: 1,
      className: "1º Ano A",
      grade: "1",
      section: "A",
      academicYear: "2025",
      maxStudents: 30,
      currentStudents: 28,
      allocatedLicenses: 15,
      usedLicenses: 12,
      coordinatorName: "Prof. Maria Silva",
      isActive: true,
    },
    {
      id: 2,
      className: "2º Ano B",
      grade: "2",
      section: "B",
      academicYear: "2025",
      maxStudents: 30,
      currentStudents: 25,
      allocatedLicenses: 12,
      usedLicenses: 10,
      coordinatorName: "Prof. João Santos",
      isActive: true,
    },
    {
      id: 3,
      className: "3º Ano C",
      grade: "3",
      section: "C",
      academicYear: "2025",
      maxStudents: 28,
      currentStudents: 26,
      allocatedLicenses: 14,
      usedLicenses: 11,
      coordinatorName: "Prof. Ana Costa",
      isActive: true,
    },
  ];

  const mockApprovals = [
    {
      id: 1,
      userName: "Pedro Oliveira",
      userEmail: "pedro.oliveira@gmail.com",
      requestedRole: "teacher",
      className: "4º Ano A",
      requestedAt: "2025-06-29T10:30:00Z",
      parentalConsent: false,
      documentsSubmitted: { diploma: true, background_check: true },
    },
    {
      id: 2,
      userName: "Carla Mendes",
      userEmail: "carla.mendes@yahoo.com",
      requestedRole: "coordinator",
      requestedAt: "2025-06-28T14:20:00Z",
      parentalConsent: false,
      documentsSubmitted: { diploma: true, background_check: false },
    },
    {
      id: 3,
      userName: "Lucas Silva",
      userEmail: "lucas.silva@hotmail.com",
      requestedRole: "student",
      className: "2º Ano B",
      requestedAt: "2025-06-27T16:45:00Z",
      parentalConsent: true,
      parentName: "Maria Silva",
      parentEmail: "maria.silva@gmail.com",
      documentsSubmitted: { birth_certificate: true, medical_records: true },
    },
  ];

  const mockInvitations = [
    {
      id: 1,
      email: "prof.matematica@escola.com",
      role: "teacher",
      className: "5º Ano A",
      status: "pending",
      sentAt: "2025-06-30T09:00:00Z",
      expiresAt: "2025-07-07T09:00:00Z",
    },
    {
      id: 2,
      email: "coord.pedagogico@escola.com",
      role: "coordinator",
      status: "accepted",
      sentAt: "2025-06-28T11:30:00Z",
      expiresAt: "2025-07-05T11:30:00Z",
    },
  ];

  const mockReports = [
    {
      id: 1,
      reportType: "usage",
      title: "Relatório de Uso de IA - Dezembro 2025",
      description: "Análise do uso de ferramentas de IA por turma e professor",
      createdAt: "2025-06-30T08:00:00Z",
      periodStart: "2025-06-01T00:00:00Z",
      periodEnd: "2025-06-30T23:59:59Z",
    },
    {
      id: 2,
      reportType: "pedagogical",
      title: "Relatório Pedagógico - 2º Trimestre",
      description: "Análise de desempenho e engajamento dos alunos",
      createdAt: "2025-06-29T16:30:00Z",
      periodStart: "2025-04-01T00:00:00Z",
      periodEnd: "2025-06-30T23:59:59Z",
    },
    {
      id: 3,
      reportType: "compliance",
      title: "Relatório de Conformidade LGPD",
      description: "Verificação de compliance com regulamentações",
      createdAt: "2025-06-25T14:15:00Z",
      periodStart: "2025-06-01T00:00:00Z",
      periodEnd: "2025-06-30T23:59:59Z",
    },
  ];

  // Get school statistics
  app.get('/api/school/stats', authenticateSchoolDirector, (req: Request, res: Response) => {
    const stats = {
      totalLicenses: 150,
      usedLicenses: 98,
      totalClasses: 12,
      totalTeachers: 18,
      totalStudents: 342,
      pendingApprovals: 3,
      activeInvitations: 2,
      monthlyTokenUsage: 15750,
      tokenLimit: 25000,
    };

    res.json(stats);
  });

  // Get all school classes
  app.get('/api/school/classes', authenticateSchoolDirector, (req: Request, res: Response) => {
    res.json(mockClasses);
  });

  // Create new class
  app.post('/api/school/classes', authenticateSchoolDirector, (req: Request, res: Response) => {
    const newClass = {
      id: mockClasses.length + 1,
      ...req.body,
      currentStudents: 0,
      usedLicenses: 0,
      isActive: true,
    };
    
    mockClasses.push(newClass);
    res.status(201).json(newClass);
  });

  // Get pending approvals
  app.get('/api/school/approvals', authenticateSchoolDirector, (req: Request, res: Response) => {
    res.json(mockApprovals);
  });

  // Approve or reject user
  app.patch('/api/school/approvals/:id', authenticateSchoolDirector, (req: Request, res: Response) => {
    const { id } = req.params;
    const { action } = req.body;
    
    const approval = mockApprovals.find(a => a.id === parseInt(id));
    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    // Remove from pending list if approved/rejected
    const index = mockApprovals.findIndex(a => a.id === parseInt(id));
    if (index > -1) {
      mockApprovals.splice(index, 1);
    }

    res.json({ message: `User ${action}ed successfully` });
  });

  // Get invitations
  app.get('/api/school/invitations', authenticateSchoolDirector, (req: Request, res: Response) => {
    res.json(mockInvitations);
  });

  // Send invitation
  app.post('/api/school/invitations', authenticateSchoolDirector, (req: Request, res: Response) => {
    const { email, role, classId } = req.body;
    
    const invitation = {
      id: mockInvitations.length + 1,
      email,
      role,
      className: classId ? mockClasses.find(c => c.id === parseInt(classId))?.className : undefined,
      status: "pending",
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    mockInvitations.push(invitation);
    res.status(201).json({ 
      message: "Convite enviado com sucesso",
      invitation
    });
  });

  // Get reports
  app.get('/api/school/reports', authenticateSchoolDirector, (req: Request, res: Response) => {
    res.json(mockReports);
  });

  // Generate new report
  app.post('/api/school/reports', authenticateSchoolDirector, (req: Request, res: Response) => {
    const { reportType, title, description, periodStart, periodEnd } = req.body;
    
    const report = {
      id: mockReports.length + 1,
      reportType,
      title,
      description,
      periodStart,
      periodEnd,
      createdAt: new Date().toISOString(),
    };

    mockReports.push(report);
    res.status(201).json({
      message: "Relatório gerado com sucesso",
      report
    });
  });

  // Get school configurations
  app.get('/api/school/configs', authenticateSchoolDirector, (req: Request, res: Response) => {
    const configs = {
      "ai_limit_1_3_years": 10,
      "ai_limit_4_6_years": 20,
      "ai_limit_7_9_years": 30,
      "excessive_use_alerts": true,
      "content_filter": true,
      "conversation_logs": true,
      "parent_notifications": false,
    };

    res.json(configs);
  });

  // Update school configurations
  app.post('/api/school/configs', authenticateSchoolDirector, (req: Request, res: Response) => {
    // Here would be the logic to save configurations
    res.json({ message: "Configurações salvas com sucesso" });
  });
}