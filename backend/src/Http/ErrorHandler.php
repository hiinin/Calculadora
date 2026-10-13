<?php

declare(strict_types=1);

namespace App\Http;

use App\Domain\Exception\CalculationException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Exception\HttpException;
use Slim\Psr7\Response as SlimResponse;
use Throwable;

/**
 * Converte qualquer exceção em JSON padronizado: {"error": {"message": "..."}}.
 * Erros de domínio -> 422; erros HTTP do Slim (404/405) mantêm o status;
 * o resto -> 500 sem vazar detalhes internos (só em modo debug).
 */
final class ErrorHandler
{
    public function __construct(private readonly bool $debug = false)
    {
    }

    public function __invoke(Request $request, Throwable $exception): Response
    {
        [$status, $message] = match (true) {
            $exception instanceof CalculationException => [422, $exception->getMessage()],
            $exception instanceof HttpException => [$exception->getCode(), $exception->getMessage()],
            default => [500, $this->debug ? $exception->getMessage() : 'Erro interno do servidor.'],
        };

        $response = new SlimResponse($status);
        $response->getBody()->write(
            json_encode(['error' => ['message' => $message]], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        );

        return $response->withHeader('Content-Type', 'application/json');
    }
}
