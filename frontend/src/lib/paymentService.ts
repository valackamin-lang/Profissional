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

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    payment: {
      id: string;
      reference: string;
      amount: number;
      currency: string;
      status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
      paidAt?: string;
      type: 'MENTORSHIP' | 'EVENT';
      mentorshipId?: string;
      eventId?: string;
    };
  };
}

export interface PaymentCheckResponse {
  success: boolean;
  data: {
    hasPayment: boolean;
    payment: {
      id: string;
      reference: string;
      amount: number;
      status: string;
      paidAt?: string;
    } | null;
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
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    const response = await api.get(`/gpo/${paymentId}/status`);
    return response.data;
  },

  /**
   * Verifica se existe pagamento para um recurso
   */
  async checkPaymentByResource(
    mentorshipId?: string,
    eventId?: string
  ): Promise<PaymentCheckResponse> {
    const params = new URLSearchParams();
    if (mentorshipId) params.append('mentorshipId', mentorshipId);
    if (eventId) params.append('eventId', eventId);
    const response = await api.get(`/gpo/check?${params.toString()}`);
    return response.data;
  },
};
