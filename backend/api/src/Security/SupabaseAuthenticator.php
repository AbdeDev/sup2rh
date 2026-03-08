<?php

namespace App\Security;

use App\Services\AdminTokenService;
use App\Services\ProfileService;
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
        private readonly SupabaseJwtVerifier $jwtVerifier,
        private readonly ProfileService $profileService,
        private readonly AdminTokenService $adminTokenService
    ) {}

    public function supports(Request $request): ?bool
    {
        $path = $request->getPathInfo();
        
        if ($request->getMethod() === 'OPTIONS') {
            return false;
        }

        // Routes publiques : pas d'authentification requise
        if ($path === '/api/health'
            || str_starts_with($path, '/api/admin/login')
            || str_starts_with($path, '/api/debug')
            || str_starts_with($path, '/api/jobs')
        ) {
            return false;
        }

        if (!str_starts_with($path, '/api')) {
            return false;
        }

        // Si pas de token Bearer, ne pas déclencher l'authenticator
        // (laisser Symfony gérer via access_control / IS_AUTHENTICATED_ANONYMOUSLY)
        if ($this->extractBearerToken($request) === null) {
            return false;
        }

        return true;
    }

    public function authenticate(Request $request): Passport
    {
        $token = $this->extractBearerToken($request);
        if ($token === null) {
            throw new AuthenticationException('Missing or invalid Authorization header');
        }

        $adminPayload = $this->adminTokenService->verify($token);
        if ($adminPayload !== null) {
            $user = new AuthUser(
                id: $adminPayload['sub'],
                email: $adminPayload['email'],
                claims: [],
                roles: ['ROLE_USER', 'ROLE_ADMIN']
            );

            return new SelfValidatingPassport(
                new UserBadge($adminPayload['sub'], fn () => $user)
            );
        }

        try {
            $decoded = $this->jwtVerifier->verify($token);
        } catch (\Exception $e) {
            throw new AuthenticationException('Invalid token: ' . $e->getMessage());
        }

        $userId = $decoded['user_id'];
        $email = $decoded['email'] ?? null;
        $profile = $this->profileService->ensureProfile($userId, $email);
        // Accès admin : on vérifie uniquement le rôle en BDD (pas d’email ni d’invitation spécifique)
        $roles = strtoupper((string) $profile->getRole()) === 'ADMIN'
            ? ['ROLE_USER', 'ROLE_ADMIN']
            : ['ROLE_USER'];

        $user = new AuthUser(
            id: $userId,
            email: $email,
            claims: $decoded['raw'] ?? [],
            roles: $roles
        );

        return new SelfValidatingPassport(
            new UserBadge($userId, fn () => $user)
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

    private function extractBearerToken(Request $request): ?string
    {
        $candidates = [
            $request->headers->get('Authorization'),
            $request->headers->get('X-Forwarded-Authorization'),
            $request->server->get('HTTP_AUTHORIZATION'),
            $request->server->get('REDIRECT_HTTP_AUTHORIZATION'),
        ];

        // Proxy/CDN stacks may forward Authorization under unusual server keys.
        foreach ($request->server->all() as $key => $value) {
            if (!is_string($value)) {
                continue;
            }
            if (str_contains((string) $key, 'AUTHORIZATION')) {
                $candidates[] = $value;
            }
        }

        foreach ($candidates as $value) {
            if (!is_string($value)) {
                continue;
            }
            if (preg_match('/^Bearer\s+(.+)$/i', trim($value), $matches) === 1) {
                return $matches[1];
            }
        }

        return null;
    }
}
