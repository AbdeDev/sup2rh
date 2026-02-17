<?php

namespace App\Controller\Api;

use App\Security\AuthUser;
use App\Services\ProfileService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/me', name: 'api_me_')]
final class MeController extends AbstractController
{
    #[Route('', name: 'get', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function get(ProfileService $profileService): JsonResponse
    {
        /** @var AuthUser $user */
        $user = $this->getUser();
        
        // S'assurer que le profile existe
        $profileService->ensureProfile($user->getUserIdentifier(), $user->email);

        $isAdmin = $profileService->isAdmin($user->getUserIdentifier());

        return $this->json([
            'id' => $user->getUserIdentifier(),
            'email' => $user->email,
            'role' => $isAdmin ? 'ADMIN' : 'USER',
        ]);
    }
}
