# Integração GPO (Gateway de Pagamento Online) - EMIS

## 📋 Visão Geral

O GPO (Gateway de Pagamento Online) da EMIS é um gateway de pagamento angolano que permite processar pagamentos através de:
- **QR Code** (PAYMENT)
- **Mobile Money** (PAYMENT ou AUTHORIZATION)
- **Cartão de Crédito/Débito** (AUTHORIZATION apenas)

## 🔄 Fluxo de Pagamento GPO

### 1. **Geração do Token de Compra (Purchase Token)**
```
Frontend → Backend → GPO API
```

**Endpoint GPO:** `POST https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken`

**Payload:**
```json
{
  "reference": "PAY2025012312345",  // Referência única (máx 15 caracteres)
  "amount": 50000,                   // Valor em Kz
  "token": "FRAME_TOKEN",            // Token do frame (configurado)
  "callbackUrl": "https://seu-site.com/api/payments/callback",
  "qrCode": "PAYMENT",               // PAYMENT ou DISABLED
  "mobile": "PAYMENT",               // PAYMENT, AUTHORIZATION ou DISABLED
  "card": "AUTHORIZATION",           // AUTHORIZATION ou DISABLED (NÃO aceita PAYMENT)
  "cssUrl": "https://seu-site.com/payment.css" // Opcional
}
```

**Resposta:**
```json
{
  "id": "purchase_token_123",        // Token de compra
  "timeToLive": 3600                 // Tempo de vida em segundos
}
```

### 2. **Exibição do Iframe**
```
Frontend exibe: https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe?token={purchase_token}
```

### 3. **Callback de Notificação**
```
GPO → Backend (POST /api/payments/callback)
```

**Payload do Callback:**
```json
{
  "reference": "PAY2025012312345",
  "status": "completed",             // completed, failed, cancelled, etc.
  "transaction_id": "TXN123",
  "message": "Pagamento realizado com sucesso"
}
```

### 4. **PostMessage do Iframe**
O iframe do GPO também envia mensagens via `postMessage` para o frontend:
```javascript
window.postMessage({
  status: 'completed',
  reference: 'PAY2025012312345'
}, 'https://cerpagamentonline.emis.co.ao');
```

## 🗄️ Estrutura de Dados Necessária

### Modelo Payment (Backend)

```typescript
interface PaymentAttributes {
  id: string;                        // UUID
  userId: string;                    // ID do usuário
  mentorshipId?: string;             // ID da mentoria (se aplicável)
  eventId?: string;                  // ID do evento (se aplicável)
  reference: string;                 // Referência única (máx 15 chars)
  amount: number;                    // Valor em Kz
  currency: string;                  // 'AOA' (Kwanza)
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  type: 'MENTORSHIP' | 'EVENT' | 'SUBSCRIPTION';
  
  // Campos específicos do GPO
  gpo_purchase_token?: string;       // Token retornado pelo GPO
  gpo_transaction_id?: string;       // ID da transação do GPO
  gpo_response?: Record<string, any>; // Resposta completa do GPO (JSON)
  
  // Metadados
  paid_at?: Date;
  failure_reason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 🔧 Implementação Backend (Node.js/TypeScript)

### 1. **Atualizar Model Payment**

```typescript
// backend/src/models/Payment.ts
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type PaymentType = 'SUBSCRIPTION' | 'EVENT' | 'MENTORSHIP';

export interface PaymentAttributes {
  id: string;
  userId: string;
  mentorshipId?: string;
  eventId?: string;
  reference: string;                 // NOVO
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, any>;
  
  // Campos GPO
  gpoPurchaseToken?: string;         // NOVO
  gpoTransactionId?: string;         // NOVO
  gpoResponse?: Record<string, any>;  // NOVO
  
  paidAt?: Date;                     // NOVO
  failureReason?: string;            // NOVO
  createdAt?: Date;
  updatedAt?: Date;
}
```

### 2. **Criar Service GPO**

```typescript
// backend/src/services/gpoService.ts
import axios from 'axios';
import Payment from '../models/Payment';

interface GPOPurchaseTokenRequest {
  reference: string;
  amount: number;
  token: string;
  callbackUrl: string;
  qrCode: 'PAYMENT' | 'DISABLED';
  mobile: 'PAYMENT' | 'AUTHORIZATION' | 'DISABLED';
  card: 'AUTHORIZATION' | 'DISABLED';
  cssUrl?: string;
}

interface GPOPurchaseTokenResponse {
  id: string;
  timeToLive?: number;
}

export class GPOService {
  private apiUrl: string;
  private frameToken: string;
  private callbackUrl: string;
  private frameUrl: string;
  private cssUrl?: string;
  private verifySsl: boolean;
  private timeout: number;

  constructor() {
    this.apiUrl = process.env.GPO_API_URL || 
      'https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken';
    this.frameToken = process.env.GPO_FRAME_TOKEN || '';
    this.callbackUrl = process.env.GPO_CALLBACK_URL || 
      `${process.env.FRONTEND_URL}/api/payments/callback`;
    this.frameUrl = process.env.GPO_FRAME_URL || 
      'https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe';
    this.cssUrl = process.env.GPO_CSS_URL;
    this.verifySsl = process.env.GPO_VERIFY_SSL !== 'false';
    this.timeout = parseInt(process.env.GPO_TIMEOUT || '30000', 10);
  }

  /**
   * Gera referência única para pagamento (máx 15 caracteres)
   */
  static generateReference(): string {
    const prefix = 'PAY';
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`.substring(0, 15);
  }

  /**
   * Gera token de compra no GPO
   */
  async generatePurchaseToken(
    reference: string,
    amount: number
  ): Promise<GPOPurchaseTokenResponse> {
    const payload: GPOPurchaseTokenRequest = {
      reference,
      amount,
      token: this.frameToken,
      callbackUrl: this.callbackUrl,
      qrCode: 'PAYMENT',
      mobile: 'PAYMENT',
      card: 'AUTHORIZATION',
    };

    if (this.cssUrl) {
      payload.cssUrl = this.cssUrl;
    }

    const axiosConfig: any = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (!this.verifySsl) {
      axiosConfig.httpsAgent = new (require('https').Agent)({
        rejectUnauthorized: false,
      });
    }

    const response = await axios.post<GPOPurchaseTokenResponse>(
      this.apiUrl,
      payload,
      axiosConfig
    );

    if (!response.data.id) {
      throw new Error('GPO não retornou token de compra válido');
    }

    return response.data;
  }

  /**
   * Constrói URL do iframe
   */
  buildIframeUrl(purchaseToken: string): string {
    return `${this.frameUrl}?token=${purchaseToken}`;
  }
}
```

### 3. **Criar Controller de Pagamentos GPO**

```typescript
// backend/src/controllers/gpoController.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import Payment from '../models/Payment';
import Profile from '../models/Profile';
import Mentorship from '../models/Mentorship';
import Event from '../models/Event';
import { GPOService } from '../services/gpoService';
import AuditLog from '../models/AuditLog';

const gpoService = new GPOService();

/**
 * Gera token de pagamento para mentoria ou evento
 */
export const generatePurchaseToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { mentorshipId, eventId } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!mentorshipId && !eventId) {
      throw new AppError('mentorshipId ou eventId é obrigatório', 400);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Buscar mentoria ou evento
    let resource: Mentorship | Event | null = null;
    let amount = 0;
    let type: 'MENTORSHIP' | 'EVENT' = 'MENTORSHIP';

    if (mentorshipId) {
      resource = await Mentorship.findByPk(mentorshipId);
      if (!resource) {
        throw new AppError('Mentoria não encontrada', 404);
      }
      amount = Number(resource.price) || 0;
      type = 'MENTORSHIP';
    } else if (eventId) {
      resource = await Event.findByPk(eventId);
      if (!resource) {
        throw new AppError('Evento não encontrado', 404);
      }
      amount = Number(resource.price) || 0;
      type = 'EVENT';
    }

    if (amount <= 0) {
      throw new AppError('Recurso não possui valor configurado', 400);
    }

    // Verificar se já existe pagamento completo
    const existingPayment = await Payment.findOne({
      where: {
        userId,
        ...(mentorshipId ? { mentorshipId } : { eventId }),
        status: 'COMPLETED',
      },
    });

    if (existingPayment) {
      throw new AppError('Já existe um pagamento completo para este recurso', 409);
    }

    // Cancelar pagamentos pendentes anteriores
    await Payment.update(
      { status: 'CANCELLED', failureReason: 'Nova tentativa de pagamento iniciada' },
      {
        where: {
          userId,
          ...(mentorshipId ? { mentorshipId } : { eventId }),
          status: ['PENDING', 'PROCESSING'],
        },
      }
    );

    // Gerar referência única
    let reference = GPOService.generateReference();
    let attempts = 0;
    while (await Payment.findOne({ where: { reference } }) && attempts < 10) {
      reference = GPOService.generateReference();
      attempts++;
    }

    // Criar registro de pagamento
    const payment = await Payment.create({
      userId,
      mentorshipId: mentorshipId || undefined,
      eventId: eventId || undefined,
      reference,
      amount,
      currency: 'AOA',
      type,
      status: 'PENDING',
    });

    // Gerar token no GPO
    const gpoResponse = await gpoService.generatePurchaseToken(reference, amount);

    // Atualizar pagamento com token
    payment.gpoPurchaseToken = gpoResponse.id;
    await payment.save();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'PAYMENT',
      resourceId: payment.id,
      details: { type, reference },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        purchaseToken: gpoResponse.id,
        iframeUrl: gpoService.buildIframeUrl(gpoResponse.id),
        timeToLive: gpoResponse.timeToLive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Callback do GPO
 */
export const handleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reference, status, transaction_id, message } = req.body;

    if (!reference || !status) {
      throw new AppError('Dados inválidos no callback', 422);
    }

    const payment = await Payment.findOne({ where: { reference } });
    if (!payment) {
      throw new AppError('Pagamento não encontrado', 404);
    }

    const gpoStatus = status.toLowerCase();

    if (['completed', 'success', 'paid', 'approved'].includes(gpoStatus)) {
      payment.status = 'COMPLETED';
      payment.paidAt = new Date();
      if (transaction_id) {
        payment.gpoTransactionId = transaction_id;
      }
      payment.gpoResponse = req.body;
      await payment.save();

      // Aqui você pode criar a inscrição automaticamente
      // Ex: criar MentorshipSubscription ou EventRegistration
    } else if (['failed', 'error', 'rejected', 'cancelled'].includes(gpoStatus)) {
      payment.status = 'FAILED';
      payment.failureReason = message || 'Pagamento falhou';
      payment.gpoResponse = req.body;
      await payment.save();
    } else {
      payment.status = 'PROCESSING';
      payment.gpoResponse = req.body;
      await payment.save();
    }

    res.json({
      success: true,
      message: 'Callback processado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica status do pagamento
 */
export const checkPaymentStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { paymentId } = req.params;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const payment = await Payment.findOne({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      throw new AppError('Pagamento não encontrado', 404);
    }

    res.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          reference: payment.reference,
          amount: payment.amount,
          status: payment.status,
          paidAt: payment.paidAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
```

### 4. **Criar Rotas**

```typescript
// backend/src/routes/gpoRoutes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import {
  generatePurchaseToken,
  handleCallback,
  checkPaymentStatus,
} from '../controllers/gpoController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import express from 'express';

const router = Router();

// Callback do GPO (sem autenticação, mas pode ter validação de IP)
router.post(
  '/callback',
  express.json(),
  handleCallback
);

// Rotas autenticadas
router.use(authenticate);

router.post(
  '/generate-token',
  [
    body('mentorshipId').optional().isUUID(),
    body('eventId').optional().isUUID(),
  ],
  validateRequest,
  generatePurchaseToken
);

router.get('/:paymentId/status', checkPaymentStatus);

export default router;
```

## 🎨 Implementação Frontend (Next.js)

### 1. **Service de Pagamento**

```typescript
// frontend/src/lib/paymentService.ts
import api from './api';

export interface PaymentTokenResponse {
  success: boolean;
  data: {
    paymentId: string;
    purchaseToken: string;
    iframeUrl: string;
    timeToLive?: number;
  };
}

export const paymentService = {
  /**
   * Gera token de pagamento
   */
  async generatePurchaseToken(
    mentorshipId?: string,
    eventId?: string
  ): Promise<PaymentTokenResponse> {
    const response = await api.post('/gpo/generate-token', {
      mentorshipId,
      eventId,
    });
    return response.data;
  },

  /**
   * Verifica status do pagamento
   */
  async checkPaymentStatus(paymentId: string) {
    const response = await api.get(`/gpo/${paymentId}/status`);
    return response.data;
  },
};
```

### 2. **Página de Pagamento**

```typescript
// frontend/src/app/mentorships/[id]/payment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { paymentService } from '../../../lib/paymentService';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Header } from '../../../components/Header';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const mentorshipId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    if (user && mentorshipId && !iframeUrl) {
      initializePayment();
    }
  }, [user, mentorshipId]);

  // Listener para postMessage do GPO
  useEffect(() => {
    if (!paymentId || paymentCompleted) return;

    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = [
        'https://gpo.emis.co.ao',
        'https://cerpagamentonline.emis.co.ao',
      ];

      if (!allowedOrigins.includes(event.origin)) return;

      const status = event.data?.status || event.data?.Status;

      if (['completed', 'success', 'paid'].includes(status)) {
        handlePaymentSuccess();
      } else if (['failed', 'error', 'cancelled'].includes(status)) {
        handlePaymentFailure(event.data?.message || 'Pagamento falhou');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [paymentId, paymentCompleted]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await paymentService.generatePurchaseToken(mentorshipId);
      
      if (response.success && response.data.iframeUrl) {
        setIframeUrl(response.data.iframeUrl);
        setPaymentId(response.data.paymentId);
      } else {
        throw new Error('Erro ao gerar token de pagamento');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao inicializar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentCompleted(true);
    
    // Verificar status após delay
    setTimeout(async () => {
      if (paymentId) {
        const status = await paymentService.checkPaymentStatus(paymentId);
        if (status.data.payment.status === 'COMPLETED') {
          router.push(`/mentorships/${mentorshipId}`);
        }
      }
    }, 1000);
  };

  const handlePaymentFailure = (message: string) => {
    setError(message);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold mb-4">Pagamento</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {paymentCompleted && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                Pagamento realizado com sucesso!
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando gateway de pagamento...</p>
              </div>
            )}

            {iframeUrl && !paymentCompleted && (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={iframeUrl}
                  className="w-full h-[600px]"
                  title="Gateway de Pagamento GPO"
                  allow="payment"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

## ⚙️ Variáveis de Ambiente

```env
# GPO Configuration
GPO_API_URL=https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken
GPO_FRAME_TOKEN=seu_frame_token_aqui
GPO_CALLBACK_URL=https://seu-dominio.com/api/gpo/callback
GPO_FRAME_URL=https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe
GPO_CSS_URL=https://seu-dominio.com/payment.css  # Opcional
GPO_VERIFY_SSL=true  # false apenas em desenvolvimento
GPO_TIMEOUT=30000    # 30 segundos
```

## 📝 Checklist de Implementação

### Backend
- [ ] Atualizar modelo `Payment` com campos GPO
- [ ] Criar `gpoService.ts`
- [ ] Criar `gpoController.ts`
- [ ] Criar `gpoRoutes.ts`
- [ ] Registrar rotas em `app.ts`
- [ ] Adicionar variáveis de ambiente
- [ ] Testar geração de token
- [ ] Testar callback
- [ ] Criar inscrições automáticas após pagamento

### Frontend
- [ ] Criar `paymentService.ts`
- [ ] Criar página de pagamento para mentorias (`/mentorships/[id]/payment`)
- [ ] Criar página de pagamento para eventos (`/events/[id]/payment`)
- [ ] Implementar listener de postMessage
- [ ] Adicionar botões de pagamento nas páginas de detalhes
- [ ] Testar fluxo completo

## 🔒 Segurança

1. **Validação de Origem**: Sempre validar `event.origin` no postMessage
2. **Validação de Callback**: Considerar validação de IP ou assinatura
3. **HTTPS**: Usar HTTPS em produção
4. **Token Seguro**: Armazenar `GPO_FRAME_TOKEN` em variáveis de ambiente
5. **Timeout**: Configurar timeout adequado para requisições

## 🧪 Testes

1. Testar geração de token com valores válidos
2. Testar callback com diferentes status
3. Testar postMessage do iframe
4. Testar criação automática de inscrições
5. Testar tratamento de erros
