<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware([
    EnsureFrontendRequestsAreStateful::class,
    'auth:sanctum',
])->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
// OpenRouter imitation endpoints
Route::post('/openrouter/analyze-image', [\App\Http\Controllers\OpenRouterController::class, 'analyzeImage']);
Route::post('/openrouter/send-chat', [\App\Http\Controllers\OpenRouterController::class, 'sendChatMessage']);
Route::post('/openrouter/calculate-cost', [\App\Http\Controllers\OpenRouterController::class, 'calculateCostEndpoint']);





});

