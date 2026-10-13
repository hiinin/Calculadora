<?php

declare(strict_types=1);

use App\Bootstrap;
use Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';

// .env é opcional (em produção as variáveis vêm do ambiente).
Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();

$origins = array_filter(array_map('trim', explode(',', $_ENV['CORS_ORIGINS'] ?? '')));

Bootstrap::createApp([
    'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
    'cors_origins' => array_values($origins),
])->run();
