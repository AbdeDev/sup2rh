<?php

namespace App\Security;

use Symfony\Component\Security\Core\User\UserInterface;

final class AuthUser implements UserInterface
{
    /** @param array<string, mixed> $claims */
    public function __construct(
        public readonly string $id,
        public readonly ?string $email,
        public readonly array $claims,
        /** @var list<string> */
        public readonly array $roles = ['ROLE_USER']
    ) {}

    public function getRoles(): array
    {
        return $this->roles;
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
