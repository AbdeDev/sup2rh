<?php

namespace App\Controller\Api;

use App\Repository\ProfileRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * En dev uniquement : liste les profils (email + role) pour vérifier
 * que le backend lit bien la même base que Supabase.
 */
#[Route('/api/debug', name: 'api_debug_')]
final class DebugProfilesController extends AbstractController
{
    #[Route('/profiles', name: 'profiles', methods: ['GET'])]
    public function profiles(ProfileRepository $profileRepository): JsonResponse
    {
        if ($this->getParameter('kernel.environment') !== 'dev') {
            return $this->json(['message' => 'Disponible uniquement en dev'], 404);
        }

        $all = $profileRepository->findBy([], ['createdAt' => 'DESC'], 20);
        $list = array_map(static function ($p) {
            return [
                'id' => $p->getId(),
                'email' => $p->getEmail(),
                'role' => $p->getRole(),
            ];
        }, $all);

        return $this->json([
            'hint' => 'Si tu ne vois pas ton compte ou le bon rôle, vérifie que DATABASE_URL dans .env pointe vers la base Supabase.',
            'count' => count($list),
            'profiles' => $list,
        ]);
    }
}
