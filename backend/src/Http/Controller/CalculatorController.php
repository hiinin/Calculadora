<?php

declare(strict_types=1);

namespace App\Http\Controller;

use App\Domain\Calculator;
use App\Domain\Exception\CalculationException;
use App\Domain\Operation;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Camada HTTP fina: traduz request -> domínio -> response.
 * Nenhuma regra de cálculo mora aqui; o Calculator é injetado (DI).
 */
final class CalculatorController
{
    public function __construct(private readonly Calculator $calculator)
    {
    }

    public function calculate(Request $request, Response $response): Response
    {
        $body = $request->getParsedBody();
        if (!is_array($body)) {
            throw new CalculationException('Envie um corpo JSON válido.');
        }

        $operation = $this->parseOperation($body['operation'] ?? null);
        $a = $this->parseOperand($body, 'a');
        $b = array_key_exists('b', $body) ? $this->parseOperand($body, 'b') : null;

        $result = $this->calculator->calculate($operation, $a, $b);

        return $this->json($response, ['result' => $result]);
    }

    /** Lista operações para o front descobrir o que a API suporta. */
    public function operations(Request $request, Response $response): Response
    {
        $list = array_map(
            static fn (Operation $op): array => ['name' => $op->value, 'binary' => $op->isBinary()],
            Operation::cases(),
        );

        return $this->json($response, ['operations' => $list]);
    }

    private function parseOperation(mixed $value): Operation
    {
        if (!is_string($value)) {
            throw new CalculationException('O campo "operation" é obrigatório.');
        }

        return Operation::tryFrom($value) ?? throw CalculationException::unknownOperation($value);
    }

    /** @param array<string, mixed> $body */
    private function parseOperand(array $body, string $key): string
    {
        $value = $body[$key] ?? null;

        // Aceita número ou string; recusa bool/array/null (is_numeric aceitaria "1e3", o domínio valida).
        if (!is_string($value) && !is_int($value) && !is_float($value)) {
            throw new CalculationException(sprintf('O campo "%s" deve ser um número.', $key));
        }

        return (string) $value;
    }

    /** @param array<string, mixed> $data */
    private function json(Response $response, array $data, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
}
