<?php

namespace App\Services;

use App\Entity\Profile;
use App\Repository\ProfileRepository;
use Doctrine\ORM\EntityManagerInterface;

final class ProfileService
{
    public function __construct(
        private readonly ProfileRepository $profileRepository,
        private readonly EntityManagerInterface $em
    ) {}

    public function ensureProfile(string $userId, ?string $email = null): Profile
    {
        $profile = $this->profileRepository->find($userId);

        if (!$profile) {
            $profile = new Profile();
            $profile->setId($userId);
            $profile->setEmail($email);
            $profile->setRole('USER');

            $this->em->persist($profile);
            $this->em->flush();
        } elseif ($email && !$profile->getEmail()) {
            $profile->setEmail($email);
            $this->em->flush();
        }

        return $profile;
    }

    public function isAdmin(string $userId): bool
    {
        $profile = $this->profileRepository->find($userId);
        return $profile && $profile->getRole() === 'ADMIN';
    }

    public function setRole(string $userId, string $role): void
    {
        $profile = $this->profileRepository->find($userId);
        
        if (!$profile) {
            $profile = $this->ensureProfile($userId);
        }

        $profile->setRole($role);
        $this->em->flush();
    }

    public function getProfile(string $userId): ?Profile
    {
        return $this->profileRepository->find($userId);
    }
}
