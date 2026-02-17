<?php

namespace App\Security;

use Firebase\JWT\JWT;
use Firebase\JWT\JWK;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class SupabaseJwtVerifier
{
    public function __construct(
        private readonly string $projectUrl,
        private readonly string $audience,
        private readonly HttpClientInterface $http,
        private readonly CacheInterface $cache
    ) {}

    /** @return array{user_id:string,email?:string,raw:array} */
    public function verify(string $jwt): array
    {
        $jwks = $this->cache->get('supabase_jwks', function () {
            $url = rtrim($this->projectUrl, '/') . '/auth/v1/.well-known/jwks.json';
            $resp = $this->http->request('GET', $url);
            return $resp->toArray();
        });

        $keys = JWK::parseKeySet($jwks);
        $decoded = (array) JWT::decode($jwt, $keys);

        // checks
        if (($decoded['aud'] ?? null) !== $this->audience) {
            throw new \RuntimeException('Invalid token audience');
        }

        $sub = $decoded['sub'] ?? null;
        if (!is_string($sub) || $sub === '') {
            throw new \RuntimeException('Invalid token subject');
        }

        return [
            'user_id' => $sub,
            'email' => is_string($decoded['email'] ?? null) ? $decoded['email'] : null,
            'raw' => $decoded,
        ];
    }
}
