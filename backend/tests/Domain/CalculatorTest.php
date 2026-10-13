<?php

declare(strict_types=1);

namespace Tests\Domain;

use App\Domain\Calculator;
use App\Domain\Exception\CalculationException;
use App\Domain\Operation;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CalculatorTest extends TestCase
{
    private Calculator $calculator;

    protected function setUp(): void
    {
        $this->calculator = new Calculator();
    }

    /** @return iterable<string, array{Operation, string, ?string, string}> */
    public static function validCases(): iterable
    {
        yield 'soma' => [Operation::Add, '2', '3', '5'];
        yield 'soma sem erro de float' => [Operation::Add, '0.1', '0.2', '0.3'];
        yield 'subtração negativa' => [Operation::Subtract, '2', '5', '-3'];
        yield 'multiplicação' => [Operation::Multiply, '1.5', '4', '6'];
        yield 'divisão exata' => [Operation::Divide, '10', '4', '2.5'];
        yield 'divisão com dízima' => [Operation::Divide, '1', '3', '0.3333333333'];
        yield 'porcentagem' => [Operation::Percent, '50', null, '0.5'];
        yield 'inverter sinal' => [Operation::Negate, '7', null, '-7'];
        yield 'inverter zero' => [Operation::Negate, '0', null, '0'];
        yield 'inteiro com zeros à direita' => [Operation::Multiply, '50', '2', '100'];
    }

    #[DataProvider('validCases')]
    public function testCalculatesValidOperations(Operation $op, string $a, ?string $b, string $expected): void
    {
        $this->assertSame($expected, $this->calculator->calculate($op, $a, $b));
    }

    public function testDivisionByZeroThrows(): void
    {
        $this->expectException(CalculationException::class);
        $this->calculator->calculate(Operation::Divide, '5', '0');
    }

    public function testInvalidNumberThrows(): void
    {
        $this->expectException(CalculationException::class);
        $this->calculator->calculate(Operation::Add, 'abc', '1');
    }

    public function testMissingSecondOperandThrows(): void
    {
        $this->expectException(CalculationException::class);
        $this->calculator->calculate(Operation::Add, '1');
    }
}
