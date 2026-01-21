<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Payment extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'id',
        'course_id',
        'student_id',
        'student_email',
        'student_name',
        'reference',
        'amount',
        'gpo_purchase_token',
        'status',
        'gpo_response',
        'gpo_transaction_id',
        'paid_at',
        'failure_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => self::STATUS_PENDING,
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($payment) {
            if (empty($payment->id)) {
                $payment->id = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the course that owns the payment.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Check if payment is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if payment is processing.
     */
    public function isProcessing(): bool
    {
        return $this->status === self::STATUS_PROCESSING;
    }

    /**
     * Check if payment is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if payment is failed.
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Check if payment is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Mark payment as completed.
     */
    public function markAsCompleted(?string $gpoTransactionId = null, ?array $gpoResponse = null): void
    {
        $this->status = self::STATUS_COMPLETED;
        $this->paid_at = now();
        
        if ($gpoTransactionId) {
            $this->gpo_transaction_id = $gpoTransactionId;
        }
        
        if ($gpoResponse) {
            $this->gpo_response = json_encode($gpoResponse);
        }
        
        $this->save();
    }

    /**
     * Mark payment as failed.
     */
    public function markAsFailed(?string $reason = null, ?array $gpoResponse = null): void
    {
        $this->status = self::STATUS_FAILED;
        $this->failure_reason = $reason;
        
        if ($gpoResponse) {
            $this->gpo_response = json_encode($gpoResponse);
        }
        
        $this->save();
    }

    /**
     * Mark payment as processing.
     */
    public function markAsProcessing(): void
    {
        $this->status = self::STATUS_PROCESSING;
        $this->save();
    }

    /**
     * Generate a unique reference for the payment.
     * Format: max 15 characters (letters and numbers only)
     * Cada chamada gera uma referência única, mesmo que seja para o mesmo estudante/curso
     * Exemplo: PAY2025012312345 (15 chars)
     */
    public static function generateReference(): string
    {
        // Gera uma referência única com máximo de 15 caracteres
        // Formato: prefixo (3) + timestamp compacto (8) + random (4) = 15 caracteres
        $prefix = 'PAY'; // 3 caracteres
        $timestamp = now()->format('YmdHis'); // 14 caracteres (ano + mês + dia + hora + minuto + segundo)
        $random = Str::random(4); // 4 caracteres alfanuméricos
        
        // Combinar: prefixo (3) + últimos 8 dígitos do timestamp (segundos incluídos) + random (4) = 15 caracteres
        // Isso garante que mesmo tentativas no mesmo minuto tenham referências diferentes
        $reference = $prefix . substr($timestamp, -8) . $random;
        
        // Garantir que tem exatamente 15 caracteres
        $reference = substr($reference, 0, 15);
        
        // Verifica se já existe, se sim, gera outra com mais aleatoriedade
        $attempts = 0;
        while (self::where('reference', $reference)->exists() && $attempts < 10) {
            $random = Str::random(4);
            // Adicionar microsegundos para garantir unicidade
            $microseconds = substr((string) microtime(true), -3); // últimos 3 dígitos dos microsegundos
            $reference = $prefix . substr($timestamp, -5) . $microseconds . $random;
            $reference = substr($reference, 0, 15);
            $attempts++;
        }
        
        // Se ainda não for único após 10 tentativas, usar UUID truncado
        if (self::where('reference', $reference)->exists()) {
            $uuid = Str::uuid()->toString();
            $reference = $prefix . strtoupper(str_replace('-', '', substr($uuid, 0, 12)));
            $reference = substr($reference, 0, 15);
        }
        
        return $reference;
    }
}

