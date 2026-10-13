<?php

declare(strict_types=1);

namespace Tests\Http;

use App\Bootstrap;
use PHPUnit\Framework\TestCase;
use Slim\Psr7\Factory\ServerRequestFactory;
use Psr\Http\Message\ResponseInterface;

/**
 * Teste de integração: executa a app inteira em memória (sem servidor web).
 */
final class CalculatorApiTest extends TestCase
{
    private const ORIGIN = 'http://localhost:5173';

    /** @param array<string, mixed>|null $json */
    private function request(string $method, string $uri, ?array $json = null, array $headers = []): ResponseInterface
    {
        $request = (new ServerRequestFactory())->createServerRequest($method, $uri);
        foreach ($headers as $name => $value) {
            $request = $request->withHeader($name, $value);
        }
        if ($json !== null) {
            $request = $request->withHeader('Content-Type', 'application/json');
            $request->getBody()->write(json_encode($json, JSON_THROW_ON_ERROR));
            $request->getBody()->rewind();
        }

        return Bootstrap::createApp(['cors_origins' => [self::ORIGIN]])->handle($request);
    }

    /** @return array<string, mixed> */
    private function decode(ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true, flags: JSON_THROW_ON_ERROR);
    }

    public function testHealth(): void
    {
        $response = $this->request('GET', '/api/health');

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(['status' => 'ok'], $this->decode($response));
    }

    public function testCalculateAddition(): void
    {
        $response = $this->request('POST', '/api/calculate', ['operation' => 'add', 'a' => '0.1', 'b' => 0.2]);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(['result' => '0.3'], $this->decode($response));
    }

    public function testUnaryOperationDoesNotNeedB(): void
    {
        $response = $this->request('POST', '/api/calculate', ['operation' => 'negate', 'a' => '5']);

        $this->assertSame(['result' => '-5'], $this->decode($response));
    }

    public function testDivisionByZeroReturns422(): void
    {
        $response = $this->request('POST', '/api/calculate', ['operation' => 'divide', 'a' => '1', 'b' => '0']);

        $this->assertSame(422, $response->getStatusCode());
        $this->assertArrayHasKey('error', $this->decode($response));
    }

    public function testUnknownOperationReturns422(): void
    {
        $response = $this->request('POST', '/api/calculate', ['operation' => 'pow', 'a' => '1', 'b' => '2']);

        $this->assertSame(422, $response->getStatusCode());
    }

    public function testMissingBodyReturns422(): void
    {
        $response = $this->request('POST', '/api/calculate');

        $this->assertSame(422, $response->getStatusCode());
    }

    public function testUnknownRouteReturnsJson404(): void
    {
        $response = $this->request('GET', '/api/nope');

        $this->assertSame(404, $response->getStatusCode());
        $this->assertArrayHasKey('error', $this->decode($response));
    }

    public function testCorsHeadersForAllowedOrigin(): void
    {
        $response = $this->request('OPTIONS', '/api/calculate', null, ['Origin' => self::ORIGIN]);

        $this->assertSame(204, $response->getStatusCode());
        $this->assertSame(self::ORIGIN, $response->getHeaderLine('Access-Control-Allow-Origin'));
    }

    public function testNoCorsHeadersForUnknownOrigin(): void
    {
        $response = $this->request('GET', '/api/health', null, ['Origin' => 'http://evil.test']);

        $this->assertSame('', $response->getHeaderLine('Access-Control-Allow-Origin'));
    }
}
