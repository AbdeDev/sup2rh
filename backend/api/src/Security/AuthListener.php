<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

final class AuthListener
{
    public function __invoke(RequestEvent $event): void
    {
        $request = $event->getRequest();
        $path = $request->getPathInfo();

        // 1) On ne protège QUE l'API
        if (!str_starts_with($path, '/api')) {
            return;
        }

        // 2) Routes publiques
        if ($path === '/api/health') {
            return;
        }

        // 3) Préflight CORS
        if ($request->getMethod() === 'OPTIONS') {
            $event->setResponse(new JsonResponse(null, 204));
            return;
        }

        // 4) La vérification du token est maintenant gérée par SupabaseAuthenticator
        // On laisse Symfony Security gérer l'authentification
    }
}
