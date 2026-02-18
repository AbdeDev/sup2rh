<?php

namespace App\Controller\Api\Admin;

use App\Repository\ProfileRepository;
use App\Services\AdminTokenService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/** Connexion admin par email seul : vérification du rôle puis délivrance d’un token. */
#[Route('/api/admin/login', name: 'api_admin_login_')]
final class AdminLoginController extends AbstractController
{
    #[Route('', name: 'submit', methods: ['POST'])]
    public function login(Request $request, ProfileRepository $profileRepository, AdminTokenService $adminToken): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || empty($data['email']) || !is_string($data['email'])) {
            return $this->json(['message' => 'Email requis'], 422);
        }

        $email = trim($data['email']);
        $profile = $profileRepository->findOneByEmail($email);

        if (!$profile) {
            return $this->json([
                'message' => "Aucun profil trouvé avec cet email. Vérifiez que la table 'profiles' contient bien cet email et que le backend utilise la même base que Supabase (variable DATABASE_URL dans .env).",
                'code' => 'PROFILE_NOT_FOUND',
            ], 403);
        }

        if (strtoupper((string) $profile->getRole()) !== 'ADMIN') {
            return $this->json([
                'message' => "Ce profil ne dispose pas des droits Administrateur",
                //"Le profil existe mais le rôle n'est pas ADMIN (valeur actuelle : '{$profile->getRole()}'). Dans Supabase, mettez la colonne 'role' à 'ADMIN' pour cet utilisateur."//
                'code' => 'ROLE_NOT_ADMIN',
            ], 403);
        }

        $token = $adminToken->create($profile->getId(), $profile->getEmail() ?? $email);

        return $this->json([
            'token' => $token,
            'user' => [
                'id' => $profile->getId(),
                'email' => $profile->getEmail(),
                'role' => $profile->getRole(),
            ],
        ]);
    }
}
