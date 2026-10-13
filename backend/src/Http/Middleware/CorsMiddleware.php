<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;

/**
 * CORS: o front (Vite, outra origem/porta) precisa de permissão do navegador
 * para chamar esta API. As origens permitidas vêm do .env (nunca "*" em produção).
 */
final class CorsMiddleware implements MiddlewareInterface
{
    /** @param list<string> $allowedOrigins */
    public function __construct(private readonly array $allowedOrigins)
    {
    }

    public function process(Request $request, Handler $handler): Response
    {
        // Preflight: o navegador pergunta "posso?" com OPTIONS antes do POST JSON.
        $response = $request->getMethod() === 'OPTIONS'
            ? new SlimResponse(204)
            : $handler->handle($request);

        $origin = $request->getHeaderLine('Origin');
        if ($origin !== '' && in_array($origin, $this->allowedOrigins, true)) {
            $response = $response
                ->withHeader('Access-Control-Allow-Origin', $origin)
                ->withHeader('Vary', 'Origin')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
        }

        return $response;
    }
}
