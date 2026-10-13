<?php

declare(strict_types=1);

namespace App\Domain;

/**
 * Operações suportadas pela calculadora.
 *
 * Um "backed enum" (PHP 8.1+) garante que só valores válidos existam,
 * eliminando "strings mágicas" espalhadas pelo código.
 */
enum Operation: string
{
    case Add = 'add';
    case Subtract = 'subtract';
    case Multiply = 'multiply';
    case Divide = 'divide';
    case Percent = 'percent';
    case Negate = 'negate';

    /** Operações que precisam de dois operandos. */
    public function isBinary(): bool
    {
        return match ($this) {
            self::Add, self::Subtract, self::Multiply, self::Divide => true,
            self::Percent, self::Negate => false,
        };
    }
}
