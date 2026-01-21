<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    /**
     * Generate purchase token from GPO.
     */
    public function generatePurchaseToken(Request $request): JsonResponse
    {
        Log::info('Payment token generation request received', [
            'request_data' => [
                'course_id' => $request->course_id,
                'student_id' => $request->student_id,
                'student_email' => $request->student_email,
                'student_name' => $request->student_name,
            ],
        ]);

        $validator = Validator::make($request->all(), [
            'course_id' => 'required|uuid|exists:courses,id',
            'student_id' => 'required|uuid',
            'student_email' => 'required|email',
            'student_name' => 'required|string',
        ]);

        if ($validator->fails()) {
            Log::warning('Payment token generation validation failed', [
                'errors' => $validator->errors()->toArray(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erro de validação',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $course = Course::findOrFail($request->course_id);

            // Verificar se já existe pagamento COMPLETO para este curso e estudante
            $completedPayment = Payment::where('course_id', $request->course_id)
                ->where('student_id', $request->student_id)
                ->where('status', Payment::STATUS_COMPLETED)
                ->first();

            if ($completedPayment) {
                Log::info('Payment already completed for this course and student', [
                    'payment_id' => $completedPayment->id,
                    'course_id' => $request->course_id,
                    'student_id' => $request->student_id,
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Já existe um pagamento completo para este curso',
                    'payment_id' => $completedPayment->id,
                ], 409);
            }

            // Se existir pagamento pendente ou processando, cancelar e criar um novo
            // Isso garante que cada tentativa tenha uma referência e token únicos
            $existingPendingPayment = Payment::where('course_id', $request->course_id)
                ->where('student_id', $request->student_id)
                ->whereIn('status', [Payment::STATUS_PENDING, Payment::STATUS_PROCESSING])
                ->first();

            if ($existingPendingPayment) {
                Log::info('Cancelling existing pending payment to create a new one', [
                    'old_payment_id' => $existingPendingPayment->id,
                    'old_reference' => $existingPendingPayment->reference,
                    'old_token' => $existingPendingPayment->gpo_purchase_token,
                    'course_id' => $request->course_id,
                    'student_id' => $request->student_id,
                ]);

                // Marcar o pagamento antigo como cancelado
                $existingPendingPayment->status = Payment::STATUS_CANCELLED;
                $existingPendingPayment->failure_reason = 'Nova tentativa de pagamento iniciada';
                $existingPendingPayment->save();
            }

            // Calcular o valor do pagamento (usar price do curso)
            $amount = $course->price ?? 0;

            if ($amount <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'O curso não possui um valor de pagamento configurado',
                ], 400);
            }

            // Gerar referência única
            $reference = Payment::generateReference();

            // Obter configurações do GPO
            $frameToken = config('services.gpo.frame_token');
            $callbackUrl = config('services.gpo.callback_url');
            $cssUrl = config('services.gpo.css_url');
            $gpoApiUrl = config('services.gpo.api_url');

            if (!$frameToken || !$callbackUrl) {
                $errorId = uniqid('CFG_', true);
                
                Log::error('GPO configuration missing', [
                    'error_id' => $errorId,
                    'frame_token' => $frameToken ? 'set' : 'missing',
                    'callback_url' => $callbackUrl ? 'set' : 'missing',
                    'gpo_api_url' => $gpoApiUrl ? 'set' : 'missing',
                    'css_url' => $cssUrl ? 'set' : 'missing',
                    'request_data' => [
                        'course_id' => $request->course_id,
                        'student_id' => $request->student_id,
                    ],
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Configuração do gateway de pagamento não encontrada',
                    'error_id' => $errorId,
                    'log_id' => $errorId,
                    'details' => [
                        'frame_token' => $frameToken ? 'configurado' : 'não configurado',
                        'callback_url' => $callbackUrl ? 'configurado' : 'não configurado',
                    ],
                ], 500);
            }

            // Criar registro de pagamento
            $payment = Payment::create([
                'course_id' => $request->course_id,
                'student_id' => $request->student_id,
                'student_email' => $request->student_email,
                'student_name' => $request->student_name,
                'reference' => $reference,
                'amount' => $amount,
                'status' => Payment::STATUS_PENDING,
            ]);

            // Preparar dados para o GPO (conforme documentação oficial GPO)
            $gpoPayload = [
                'reference' => $reference,
                'amount' => $amount,
                'token' => $frameToken,
                'callbackUrl' => $callbackUrl,
                'qrCode' => 'PAYMENT',        // Valores: PAYMENT ou DISABLED
                'mobile' => 'PAYMENT',       // Valores: PAYMENT, AUTHORIZATION ou DISABLED
                'card' => 'AUTHORIZATION',   // Valores: AUTHORIZATION ou DISABLED (NÃO aceita PAYMENT)
            ];

            // Adicionar CSS URL se configurado
            if ($cssUrl) {
                $gpoPayload['cssUrl'] = $cssUrl;
            }

            // Fazer requisição ao GPO
            $verifySsl = config('services.gpo.verify_ssl', true);
            $timeout = config('services.gpo.timeout', 30);
            
            // Log quando SSL está desabilitado (apenas para debug)
            if (!$verifySsl) {
                Log::warning('GPO SSL verification disabled', [
                    'warning' => 'SSL certificate verification is disabled. Use only in development!',
                    'gpo_api_url' => $gpoApiUrl,
                ]);
            }
            
            $httpClient = Http::timeout($timeout)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ]);
            
            // Desabilitar verificação SSL se configurado
            if (!$verifySsl) {
                $httpClient = $httpClient->withoutVerifying();
            }
            
            $response = $httpClient->post($gpoApiUrl, $gpoPayload);

            if (!$response->successful()) {
                $errorId = uniqid('GPO_', true);
                
                Log::error('GPO API error', [
                    'error_id' => $errorId,
                    'http_status' => $response->status(),
                    'http_method' => 'POST',
                    'response_body' => $response->body(),
                    'response_headers' => $response->headers(),
                    'payment_id' => $payment->id,
                    'reference' => $reference,
                    'gpo_api_url' => $gpoApiUrl,
                    'request_payload' => [
                        'reference' => $reference,
                        'amount' => $amount,
                        'callbackUrl' => $callbackUrl,
                        'token' => $frameToken ? '***set***' : 'missing',
                    ],
                    'full_request_url' => $gpoApiUrl,
                ]);

                $payment->markAsFailed('Erro ao comunicar com o gateway de pagamento');

                $gpoErrorBody = $response->json();
                $gpoErrorMessage = is_array($gpoErrorBody) && isset($gpoErrorBody['message']) 
                    ? $gpoErrorBody['message'] 
                    : 'Erro ao comunicar com o gateway de pagamento';

                // Mensagem específica para erro 405 (Method Not Allowed)
                $errorMessage = 'Erro ao gerar token de pagamento. Tente novamente.';
                if ($response->status() === 405) {
                    $errorMessage = 'URL do gateway de pagamento incorreta ou método HTTP não permitido. Verifique a configuração GPO_API_URL.';
                    $gpoErrorMessage = 'Método HTTP não permitido (405). Verifique se a URL está correta e aceita POST.';
                }

                return response()->json([
                    'status' => 'error',
                    'message' => $errorMessage,
                    'error_id' => $errorId,
                    'log_id' => $errorId,
                    'gpo_error' => $gpoErrorMessage,
                    'http_status' => $response->status(),
                    'http_method' => 'POST',
                    'gpo_api_url' => $gpoApiUrl,
                    'payment_id' => $payment->id,
                    'suggestion' => $response->status() === 405 
                        ? 'Verifique se GPO_API_URL está correto no .env. Deve ser: https://cerpagamentonline.emis.co.ao/online-payment-gateway/webframe/v1/frameToken'
                        : null,
                ], 500);
            }

            $responseData = $response->json();

            if (!isset($responseData['id'])) {
                $errorId = uniqid('INV_', true);
                
                Log::error('GPO invalid response', [
                    'error_id' => $errorId,
                    'response_data' => $responseData,
                    'response_keys' => is_array($responseData) ? array_keys($responseData) : 'not_array',
                    'payment_id' => $payment->id,
                    'reference' => $reference,
                ]);

                $payment->markAsFailed('Resposta inválida do gateway de pagamento');

                return response()->json([
                    'status' => 'error',
                    'message' => 'Resposta inválida do gateway de pagamento',
                    'error_id' => $errorId,
                    'log_id' => $errorId,
                    'details' => 'O gateway não retornou o token de compra esperado',
                    'payment_id' => $payment->id,
                ], 500);
            }

            // Atualizar pagamento com o token de compra
            $payment->gpo_purchase_token = $responseData['id'];
            $payment->save();

            Log::info('Payment token generated successfully', [
                'payment_id' => $payment->id,
                'reference' => $reference,
                'amount' => $amount,
                'purchase_token' => $responseData['id'],
                'course_id' => $request->course_id,
                'student_id' => $request->student_id,
            ]);

            return response()->json([
                'status' => 'success',
                'payment_id' => $payment->id,
                'purchase_token' => $responseData['id'],
                'iframe_url' => $this->buildIframeUrl($responseData['id']),
                'time_to_live' => $responseData['timeToLive'] ?? null,
            ]);
        } catch (\Exception $e) {
            $errorId = uniqid('ERR_', true);
            
            Log::error('Error generating purchase token', [
                'error_id' => $errorId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => [
                    'course_id' => $request->course_id ?? null,
                    'student_id' => $request->student_id ?? null,
                    'student_email' => $request->student_email ?? null,
                ],
            ]);

            // Retornar mensagem de erro mais detalhada (sem expor informações sensíveis)
            $errorMessage = 'Erro ao processar solicitação de pagamento';
            $errorDetails = null;

            // Se for um erro de modelo não encontrado, retornar mensagem específica
            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                $errorMessage = 'Recurso não encontrado';
                $errorDetails = $e->getMessage();
            } elseif ($e instanceof \Illuminate\Validation\ValidationException) {
                $errorMessage = 'Erro de validação';
                $errorDetails = $e->errors();
            } elseif (str_contains($e->getMessage(), 'Connection') || str_contains($e->getMessage(), 'timeout')) {
                $errorMessage = 'Erro de conexão com o gateway de pagamento';
            } elseif (str_contains($e->getMessage(), 'SQLSTATE')) {
                $errorMessage = 'Erro ao acessar o banco de dados';
            }

            return response()->json([
                'status' => 'error',
                'message' => $errorMessage,
                'error_id' => $errorId,
                'error_details' => config('app.debug') ? $errorDetails ?? $e->getMessage() : null,
                'log_id' => $errorId, // ID para consultar nos logs
            ], 500);
        }
    }

    /**
     * Callback endpoint for GPO notifications.
     */
    public function callback(Request $request): JsonResponse
    {
        Log::info('GPO callback received', [
            'data' => $request->all(),
        ]);

        try {
            // Validar dados do callback
            $validator = Validator::make($request->all(), [
                'reference' => 'required|string',
                'status' => 'required|string',
            ]);

            if ($validator->fails()) {
                Log::warning('GPO callback validation failed', [
                    'errors' => $validator->errors(),
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Dados inválidos',
                ], 422);
            }

            // Buscar pagamento pela referência
            $payment = Payment::where('reference', $request->reference)->first();

            if (!$payment) {
                Log::warning('Payment not found for GPO callback', [
                    'reference' => $request->reference,
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Pagamento não encontrado',
                ], 404);
            }

            // Atualizar status do pagamento baseado na resposta do GPO
            $gpoStatus = strtolower($request->status ?? '');
            $gpoResponse = $request->all();

            if (in_array($gpoStatus, ['completed', 'success', 'paid', 'approved'])) {
                $payment->markAsCompleted(
                    $request->transaction_id ?? $request->id ?? null,
                    $gpoResponse
                );

                Log::info('Payment marked as completed', [
                    'payment_id' => $payment->id,
                    'reference' => $payment->reference,
                ]);
            } elseif (in_array($gpoStatus, ['failed', 'error', 'rejected', 'cancelled'])) {
                $payment->markAsFailed(
                    $request->message ?? $request->error ?? 'Pagamento falhou',
                    $gpoResponse
                );

                Log::info('Payment marked as failed', [
                    'payment_id' => $payment->id,
                    'reference' => $payment->reference,
                ]);
            } else {
                // Status desconhecido, marcar como processando
                $payment->markAsProcessing();
                $payment->gpo_response = json_encode($gpoResponse);
                $payment->save();

                Log::info('Payment marked as processing', [
                    'payment_id' => $payment->id,
                    'reference' => $payment->reference,
                    'gpo_status' => $gpoStatus,
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Callback processado com sucesso',
            ]);
        } catch (\Exception $e) {
            Log::error('Error processing GPO callback', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erro ao processar callback',
            ], 500);
        }
    }

    /**
     * Check payment status.
     */
    public function checkStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payment_id' => 'required|uuid|exists:payments,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erro de validação',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payment = Payment::with('course')->findOrFail($request->payment_id);

        return response()->json([
            'status' => 'success',
            'payment' => [
                'id' => $payment->id,
                'reference' => $payment->reference,
                'amount' => $payment->amount,
                'status' => $payment->status,
                'paid_at' => $payment->paid_at,
                'course' => [
                    'id' => $payment->course->id,
                    'name' => $payment->course->name,
                ],
            ],
        ]);
    }

    /**
     * Get payment by student and course.
     */
    public function getByStudentAndCourse(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|uuid',
            'course_id' => 'required|uuid|exists:courses,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erro de validação',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payment = Payment::where('student_id', $request->student_id)
            ->where('course_id', $request->course_id)
            ->where('status', Payment::STATUS_COMPLETED)
            ->with('course')
            ->first();

        if (!$payment) {
            // Retornar 200 com has_payment: false para indicar que não há pagamento
            // Isso permite que o frontend redirecione para iniciar o pagamento
            return response()->json([
                'status' => 'success',
                'message' => 'Nenhum pagamento encontrado para este curso',
                'has_payment' => false,
                'requires_payment' => true,
            ], 200);
        }

        return response()->json([
            'status' => 'success',
            'has_payment' => true,
            'payment' => [
                'id' => $payment->id,
                'reference' => $payment->reference,
                'amount' => $payment->amount,
                'status' => $payment->status,
                'paid_at' => $payment->paid_at,
                'course' => [
                    'id' => $payment->course->id,
                    'name' => $payment->course->name,
                ],
            ],
        ]);
    }

    /**
     * Build iframe URL from purchase token.
     */
    private function buildIframeUrl(string $purchaseToken): string
    {
        $gpoFrameUrl = config('services.gpo.frame_url');
        return $gpoFrameUrl . '?token=' . $purchaseToken;
    }
}

