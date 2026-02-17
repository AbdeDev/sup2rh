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

        // 4) Vérification Bearer token
        $auth = $request->headers->get('Authorization');
        if (!$auth || !preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
            throw new UnauthorizedHttpException('Bearer', 'Missing bearer token');
        }

        $token = $m[1];

        // Pour l'instant: on ne valide pas encore le JWT ici (étape suivante)
        // On stocke le token en attribut pour les controllers/services
        $request->attributes->set('access_token', $token);
    }
}
