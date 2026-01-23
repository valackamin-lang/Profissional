import axios, { AxiosInstance } from 'axios';
import https from 'https';
import Payment from '../models/Payment';
import logger from '../config/logger';

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
  private httpClient: AxiosInstance;

  constructor() {
    this.apiUrl =
      process.env.GPO_API_URL ||
      'https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken';
    this.frameToken = process.env.GPO_FRAME_TOKEN || '';
    this.callbackUrl =
      process.env.GPO_CALLBACK_URL ||
      `${process.env.API_URL || process.env.FRONTEND_URL || 'http://localhost:3001'}/api/gpo/callback`;
    this.frameUrl =
      process.env.GPO_FRAME_URL ||
      'https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe';
    this.cssUrl = process.env.GPO_CSS_URL;
    this.verifySsl = process.env.GPO_VERIFY_SSL !== 'false';
    this.timeout = parseInt(process.env.GPO_TIMEOUT || '30000', 10);

    // Configurar cliente HTTP
    const axiosConfig: any = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    if (!this.verifySsl) {
      axiosConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });
    }

    this.httpClient = axios.create(axiosConfig);
  }

  /**
   * Gera referência única para pagamento (máx 15 caracteres)
   * Formato: PAY + timestamp (8) + random (4) = 15 caracteres
   */
  static async generateReference(): Promise<string> {
    const prefix = 'PAY';
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    let reference = `${prefix}${timestamp}${random}`.substring(0, 15);

    // Verificar se já existe, se sim, gerar outra
    let attempts = 0;
    while ((await Payment.findOne({ where: { reference } })) && attempts < 10) {
      const newRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
      const microseconds = Date.now().toString().slice(-3);
      reference = `${prefix}${timestamp.slice(-5)}${microseconds}${newRandom}`.substring(0, 15);
      attempts++;
    }

    // Se ainda não for único após 10 tentativas, usar UUID truncado
    if (await Payment.findOne({ where: { reference } })) {
      const uuid = require('crypto').randomUUID().replace(/-/g, '').toUpperCase();
      reference = `${prefix}${uuid.substring(0, 12)}`.substring(0, 15);
    }

    return reference;
  }

  /**
   * Gera token de compra no GPO
   */
  async generatePurchaseToken(
    reference: string,
    amount: number
  ): Promise<GPOPurchaseTokenResponse> {
    if (!this.frameToken) {
      throw new Error('GPO_FRAME_TOKEN não configurado');
    }

    if (!this.callbackUrl) {
      throw new Error('GPO_CALLBACK_URL não configurado');
    }

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

    try {
      // Log sanitizado (não logar tokens ou dados sensíveis)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('GPO Request', {
          url: this.apiUrl,
          method: 'POST',
          // Não logar payload completo em produção
        });
      }

      const response = await this.httpClient.post<GPOPurchaseTokenResponse>(
        this.apiUrl,
        payload
      );

      if (!response.data || !response.data.id) {
        throw new Error('GPO não retornou token de compra válido');
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        let errorMessage = '';
        
        // Tratar diferentes tipos de erro
        if (typeof error.response.data === 'string') {
          if (error.response.data.includes('<!doctype html>')) {
            errorMessage = 'URL incorreta - recebido HTML em vez de JSON. Verifique GPO_API_URL no .env';
          } else {
            errorMessage = error.response.data.substring(0, 200);
          }
        } else if (error.response.data && typeof error.response.data === 'object') {
          // Erro estruturado do GPO
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.code) {
            errorMessage = `Código: ${error.response.data.code} - ${error.response.data.message || 'Erro desconhecido'}`;
          } else {
            errorMessage = JSON.stringify(error.response.data);
          }
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
        
        // Mensagens específicas para códigos de erro comuns
        if (status === 400 && errorMessage.includes('invalid frame token')) {
          errorMessage = 'Token do frame inválido ou expirado. Verifique GPO_FRAME_TOKEN no .env e certifique-se de que o token está correto e ativo.';
        } else if (status === 400 && errorMessage.includes('Merchant Token is required')) {
          errorMessage = 'Token do merchant é obrigatório. Verifique se GPO_FRAME_TOKEN está configurado no .env';
        }
        
        throw new Error(
          `Erro ao comunicar com GPO (${status}): ${errorMessage}`
        );
      }
      throw new Error(`Erro ao comunicar com GPO: ${error.message}`);
    }
  }

  /**
   * Constrói URL do iframe
   */
  buildIframeUrl(purchaseToken: string): string {
    return `${this.frameUrl}?token=${purchaseToken}`;
  }
}
