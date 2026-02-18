<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/** JWT dédié à la connexion admin (email seul). */
final class AdminTokenService
{
    private const ALG = 'HS256';
    private const CLAIM_ADMIN = 'admin';

    public function __construct(
        private readonly string $secret
    ) {}

    public function create(string $userId, string $email): string
    {
        $payload = [
            'sub' => $userId,
            'email' => $email,
            self::CLAIM_ADMIN => true,
            'iat' => time(),
            'exp' => time() + (24 * 3600), // 24h
        ];

        return JWT::encode($payload, $this->secret, self::ALG);
    }

    /** @return array{sub: string, email: string}|null */
    public function verify(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, self::ALG));
            $payload = (array) $decoded;
            if (empty($payload[self::CLAIM_ADMIN]) || empty($payload['sub'])) {
                return null;
            }

            return [
                'sub' => (string) $payload['sub'],
                'email' => isset($payload['email']) ? (string) $payload['email'] : '',
            ];
        } catch (\Exception) {
            return null;
        }
    }
}
