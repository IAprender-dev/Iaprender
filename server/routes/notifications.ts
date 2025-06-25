import { Router, Request, Response } from 'express';
import { db } from '../db';
import { notifications, users } from '@shared/schema';
import { eq, and, or, desc, count, sql } from 'drizzle-orm';

const router = Router();

// Middleware para autenticação
const authenticate = (req: Request, res: Response, next: Function) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Função para gerar número sequencial único
async function generateSequentialNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(sql`EXTRACT(YEAR FROM created_at) = ${year}`);
  
  const notificationCount = result[0]?.count || 0;
  const nextNumber = (notificationCount + 1).toString().padStart(3, '0');
  return `NOT-${year}-${nextNumber}`;
}

// GET /api/notifications - Buscar notificações para o usuário logado
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    const userRole = req.session?.user?.role;
    
    if (!userId || !userRole) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Buscar notificações baseadas no role do usuário
    let whereCondition;
    
    if (userRole === 'admin') {
      // Admin/Secretaria vê todas as notificações
      whereCondition = sql`1=1`;
    } else {
      // Outros usuários veem notificações direcionadas a eles ou ao seu grupo
      whereCondition = or(
        eq(notifications.recipientId, userId),
        eq(notifications.recipientType, userRole),
        eq(notifications.recipientType, 'all'),
        eq(notifications.recipientType, 'all_teachers'),
        eq(notifications.recipientType, 'all_students')
      );
    }

    const userNotifications = await db
      .select({
        id: notifications.id,
        sequentialNumber: notifications.sequentialNumber,
        senderId: notifications.senderId,
        senderName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        recipientType: notifications.recipientType,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        priority: notifications.priority,
        status: notifications.status,
        studentId: notifications.studentId,
        parentEmail: notifications.parentEmail,
        parentPhone: notifications.parentPhone,
        requiresResponse: notifications.requiresResponse,
        responseText: notifications.responseText,
        respondedAt: notifications.respondedAt,
        sentAt: notifications.sentAt,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.senderId, users.id))
      .where(whereCondition)
      .orderBy(desc(notifications.createdAt));

    res.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// POST /api/notifications - Criar nova notificação
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    console.log('Creating notification:', req.body);
    const senderId = req.session?.user?.id;
    const senderRole = req.session?.user?.role;
    
    if (!senderId || !senderRole) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const {
      recipientType,
      recipientId,
      title,
      message,
      type = 'communication',
      priority = 'medium',
      studentId,
      parentEmail,
      parentPhone,
      requiresResponse = false,
      selectedRecipients = []
    } = req.body;

    // Validate required fields
    if (!recipientType || !title || !message) {
      return res.status(400).json({ message: 'recipientType, title, and message are required' });
    }

    // Validações baseadas no role
    if (senderRole === 'student') {
      // Estudantes só podem enviar para admin e professores
      if (!['admin', 'teacher'].includes(recipientType)) {
        return res.status(403).json({ message: 'Students can only send notifications to admin and teachers' });
      }
    } else if (senderRole === 'teacher') {
      // Professores podem enviar para admin e estudantes
      if (!['admin', 'student'].includes(recipientType)) {
        return res.status(403).json({ message: 'Teachers can only send notifications to admin and students' });
      }
    }
    // Admin pode enviar para todos

    const sequentialNumber = await generateSequentialNumber();
    console.log('Generated sequential number:', sequentialNumber);

    // Se há destinatários específicos, criar uma notificação para cada um
    if (selectedRecipients && selectedRecipients.length > 0) {
      console.log('Creating notifications for specific recipients:', selectedRecipients);
      const notificationsToCreate = selectedRecipients.map((recipientIdStr: string, index: number) => ({
        sequentialNumber: `${sequentialNumber}-${index + 1}`,
        senderId,
        recipientId: parseInt(recipientIdStr),
        recipientType,
        title,
        message,
        type,
        priority,
        studentId: studentId || null,
        parentEmail: parentEmail || null,
        parentPhone: parentPhone || null,
        requiresResponse,
        sentAt: new Date(),
      }));

      const result = await db.insert(notifications).values(notificationsToCreate).returning();
      console.log('Created notifications:', result);
    } else {
      // Notificação geral para o grupo
      console.log('Creating general notification for group:', recipientType);
      const notificationData = {
        sequentialNumber,
        senderId,
        recipientId: recipientId || null,
        recipientType,
        title,
        message,
        type,
        priority,
        studentId: studentId || null,
        parentEmail: parentEmail || null,
        parentPhone: parentPhone || null,
        requiresResponse,
        sentAt: new Date(),
      };
      
      console.log('Notification data to insert:', notificationData);
      const result = await db.insert(notifications).values(notificationData).returning();
      console.log('Created notification:', result);
    }

    console.log('Notification creation successful');
    res.status(201).json({ message: 'Notification sent successfully', sequentialNumber });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification' });
  }
});

// PATCH /api/notifications/:id/status - Atualizar status da notificação
router.patch('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const { status } = req.body;
    const userId = req.session.user.id;

    // Verificar se o usuário pode atualizar esta notificação
    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!notification[0]) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Usuário pode atualizar se for o destinatário ou se for secretaria
    const canUpdate = 
      notification[0].recipientId === userId ||
      req.session.user.role === 'secretary' ||
      notification[0].senderId === userId;

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }

    const updateData: any = { status, updatedAt: new Date() };
    
    // Se marcando como lida, adicionar timestamp
    if (status === 'read' && !notification[0].readAt) {
      updateData.readAt = new Date();
    }

    await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, notificationId));

    res.json({ message: 'Notification status updated successfully' });
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({ message: 'Error updating notification status' });
  }
});

// POST /api/notifications/:id/response - Responder notificação
router.post('/:id/response', authenticate, async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const { responseText } = req.body;
    const userId = req.session.user.id;

    // Verificar se a notificação existe e requer resposta
    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!notification[0]) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification[0].requiresResponse) {
      return res.status(400).json({ message: 'This notification does not require a response' });
    }

    // Verificar se o usuário pode responder
    const canRespond = 
      notification[0].recipientId === userId ||
      (notification[0].recipientType === req.session.user.role && !notification[0].recipientId);

    if (!canRespond) {
      return res.status(403).json({ message: 'Not authorized to respond to this notification' });
    }

    await db
      .update(notifications)
      .set({
        responseText,
        respondedAt: new Date(),
        status: 'read',
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, notificationId));

    res.json({ message: 'Response submitted successfully' });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ message: 'Error submitting response' });
  }
});

// DELETE /api/notifications/:id - Deletar notificação (apenas remetente ou secretaria)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.session.user.id;
    const userRole = req.session.user.role;

    // Verificar se a notificação existe
    const notification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!notification[0]) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Apenas o remetente ou secretaria podem deletar
    const canDelete = 
      notification[0].senderId === userId ||
      userRole === 'secretary';

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }

    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

// GET /api/notifications/count - Contagem de notificações não lidas
router.get('/count', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user.id;
    const userRole = req.session.user.role;

    let whereCondition;
    
    if (userRole === 'secretary') {
      whereCondition = and(
        eq(notifications.status, 'pending'),
        sql`1=1`
      );
    } else {
      whereCondition = and(
        eq(notifications.status, 'pending'),
        or(
          eq(notifications.recipientId, userId),
          eq(notifications.recipientType, userRole),
          eq(notifications.recipientType, 'all')
        )
      );
    }

    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(whereCondition);

    res.json({ unreadCount: result[0]?.count || 0 });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ message: 'Error fetching notification count' });
  }
});

export default router;