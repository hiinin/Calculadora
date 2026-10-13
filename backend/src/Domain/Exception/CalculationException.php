<?php

declare(strict_types=1);

namespace App\Domain\Exception;

use InvalidArgumentException;

/** Erro de regra de negócio/entrada inválida. O HTTP o traduz para 422. */
final class CalculationException extends InvalidArgumentException
{
    public static function divisionByZero(): self
    {
        return new self('Não é possível dividir por zero.');
    }

    public static function invalidNumber(string $value): self
    {
        return new self(sprintf('Número inválido: "%s".', $value));
    }

    public static function missingOperand(string $operation): self
    {
        return new self(sprintf('A operação "%s" exige dois operandos.', $operation));
    }

    public static function unknownOperation(string $operation): self
    {
        return new self(sprintf('Operação desconhecida: "%s".', $operation));
    }
}
