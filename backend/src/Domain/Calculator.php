<?php

declare(strict_types=1);

namespace App\Domain;

use App\Domain\Exception\CalculationException;
use Brick\Math\BigDecimal;
use Brick\Math\Exception\MathException;
use Brick\Math\RoundingMode;

/**
 * Núcleo da calculadora.
 *
 * Usa brick/math (BigDecimal) em vez de float: assim 0.1 + 0.2 = 0.3 exato,
 * sem os erros de ponto flutuante clássicos (0.30000000000000004).
 * Classe pura: não conhece HTTP, JSON nem framework -> fácil de testar.
 */
final class Calculator
{
    /** Casas decimais máximas em divisões não exatas. */
    private const SCALE = 10;

    /**
     * @param string      $a  primeiro operando (string preserva a precisão)
     * @param string|null $b  segundo operando (só para operações binárias)
     * @return string resultado sem zeros à direita
     */
    public function calculate(Operation $operation, string $a, ?string $b = null): string
    {
        $left = $this->parse($a);

        if ($operation->isBinary()) {
            if ($b === null) {
                throw CalculationException::missingOperand($operation->value);
            }
            $right = $this->parse($b);
        }

        $result = match ($operation) {
            Operation::Add => $left->plus($right),
            Operation::Subtract => $left->minus($right),
            Operation::Multiply => $left->multipliedBy($right),
            Operation::Divide => $this->divide($left, $right),
            Operation::Percent => $left->dividedBy(100, self::SCALE, RoundingMode::HalfUp),
            Operation::Negate => $left->negated(),
        };

        return $this->format($result);
    }

    private function divide(BigDecimal $left, BigDecimal $right): BigDecimal
    {
        if ($right->isZero()) {
            throw CalculationException::divisionByZero();
        }

        return $left->dividedBy($right, self::SCALE, RoundingMode::HalfUp);
    }

    private function parse(string $value): BigDecimal
    {
        try {
            return BigDecimal::of(trim($value));
        } catch (MathException) {
            throw CalculationException::invalidNumber($value);
        }
    }

    /** Remove zeros desnecessários: "2.5000000000" -> "2.5"; "-0" -> "0". */
    private function format(BigDecimal $number): string
    {
        $stripped = $number->strippedOfTrailingZeros();

        // Escala negativa (ex.: 100 -> 1E+2) viraria notação científica; normalizamos.
        if ($stripped->getScale() < 0) {
            $stripped = $stripped->toScale(0);
        }

        $text = (string) $stripped;

        return $text === '-0' ? '0' : $text;
    }
}
