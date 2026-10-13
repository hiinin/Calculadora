<?php

declare(strict_types=1);

namespace App;

use App\Http\Controller\CalculatorController;
use App\Http\ErrorHandler;
use App\Http\Middleware\CorsMiddleware;
use DI\Container;
use Slim\App;
use Slim\Factory\AppFactory;

/**
 * Composition root: único lugar que "monta" a aplicação.
 * Recebe a configuração como parâmetro (em vez de ler $_ENV direto),
 * o que permite criar a app nos testes com valores controlados.
 */
final class Bootstrap
{
    /**
     * @param array{debug?: bool, cors_origins?: list<string>} $config
     */
    public static function createApp(array $config = []): App
    {
        $container = new Container();
        AppFactory::setContainer($container);
        $app = AppFactory::create();

        // Ordem importa: o último middleware adicionado é o primeiro a executar.
        $app->addBodyParsingMiddleware(); // JSON -> getParsedBody()
        $app->addRoutingMiddleware();
        $app->add(new CorsMiddleware($config['cors_origins'] ?? []));

        $errorMiddleware = $app->addErrorMiddleware(false, false, false);
        $errorMiddleware->setDefaultErrorHandler(new ErrorHandler($config['debug'] ?? false));

        $app->get('/api/health', function ($request, $response) {
            $response->getBody()->write('{"status":"ok"}');

            return $response->withHeader('Content-Type', 'application/json');
        });
        $app->get('/api/operations', [CalculatorController::class, 'operations']);
        $app->post('/api/calculate', [CalculatorController::class, 'calculate']);
        // Preflight (OPTIONS) não precisa de rota: o CorsMiddleware, por ser o mais externo,
        // responde antes do roteamento.

        return $app;
    }
}
