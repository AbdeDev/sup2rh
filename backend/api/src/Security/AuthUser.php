<?php

namespace App\Security;

use Symfony\Component\Security\Core\User\UserInterface;

final class AuthUser implements UserInterface
{
    public function __construct(
        public readonly string $id,
        public readonly ?string $email,
        public readonly array $claims
    ) {}

    public function getRoles(): array
    {
        return ['ROLE_USER'];
    }

    public function eraseCredentials(): void
    {
        // No credentials to erase
    }

    public function getUserIdentifier(): string
    {
        return $this->id;
    }
}
