<?php

namespace App\Controller\Api\Admin;

use App\Repository\ProfileRepository;
use App\Services\ProfileService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** Gestion des utilisateurs par l’admin : liste, attribution du rôle admin. */
#[Route('/api/admin/users', name: 'api_admin_users_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminUserController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(ProfileRepository $profileRepository): JsonResponse
    {
        $profiles = $profileRepository->findBy([], ['createdAt' => 'DESC']);
        $items = array_map(static function ($p) {
            return [
                'id' => $p->getId(),
                'email' => $p->getEmail(),
                'role' => $p->getRole(),
                'createdAt' => $p->getCreatedAt()->format(DATE_ATOM),
            ];
        }, $profiles);
        return $this->json(['items' => $items]);
    }

    #[Route('/{id}/role', name: 'role', methods: ['PUT'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    public function updateRole(string $id, Request $request, ProfileService $profileService): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || !isset($data['role']) || !is_string($data['role'])) {
            return $this->json(['message' => 'role is required'], 422);
        }
        $role = strtoupper($data['role']);
        if (!in_array($role, ['USER', 'ADMIN'], true)) {
            return $this->json(['message' => 'role must be USER or ADMIN'], 422);
        }

        $profileService->setRole($id, $role);
        $profile = $profileService->getProfile($id);
        if (!$profile) {
            return $this->json(['message' => 'User not found'], 404);
        }

        return $this->json([
            'id' => $profile->getId(),
            'email' => $profile->getEmail(),
            'role' => $profile->getRole(),
            'createdAt' => $profile->getCreatedAt()->format(DATE_ATOM),
        ]);
    }
}
