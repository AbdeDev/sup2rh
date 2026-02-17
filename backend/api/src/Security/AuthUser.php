<?php

namespace App\Security;

final class AuthUser
{
    public function __construct(
        public readonly string $id,
        public readonly ?string $email,
        public readonly array $claims
    ) {}
}
