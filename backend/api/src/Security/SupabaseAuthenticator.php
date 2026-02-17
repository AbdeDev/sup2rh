<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

final class SupabaseAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private readonly SupabaseJwtVerifier $jwtVerifier
    ) {}

    public function supports(Request $request): ?bool
    {
        $path = $request->getPathInfo();
        
        // Ne pas authentifier les routes publiques
        if ($path === '/api/health' || $request->getMethod() === 'OPTIONS') {
            return false;
        }
        
        // Authentifier toutes les routes API
        return str_starts_with($path, '/api');
    }

    public function authenticate(Request $request): Passport
    {
        $authHeader = $request->headers->get('Authorization');
        
        if (!$authHeader || !preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            throw new AuthenticationException('Missing or invalid Authorization header');
        }

        $token = $matches[1];

        try {
            $decoded = $this->jwtVerifier->verify($token);
        } catch (\Exception $e) {
            throw new AuthenticationException('Invalid token: ' . $e->getMessage());
        }

        $user = new AuthUser(
            id: $decoded['user_id'],
            email: $decoded['email'] ?? null,
            claims: $decoded['raw'] ?? []
        );

        return new SelfValidatingPassport(
            new UserBadge($decoded['user_id'], fn() => $user)
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'message' => 'Authentication failed',
            'error' => $exception->getMessage(),
        ], Response::HTTP_UNAUTHORIZED);
    }
}
