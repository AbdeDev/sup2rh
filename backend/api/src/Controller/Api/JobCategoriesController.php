<?php

namespace App\Controller\Api;

use App\Repository\JobCategoryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/** Grands domaines RH — lecture publique (pour les apps front). */
#[Route('/api/job-categories', name: 'api_job_categories_')]
final class JobCategoriesController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(JobCategoryRepository $repo): JsonResponse
    {
        $cats = $repo->findBy([], ['position' => 'ASC', 'name' => 'ASC']);
        $items = array_map(static function ($cat): array {
            return [
                'id'          => $cat->getId(),
                'name'        => $cat->getName(),
                'emoji'       => $cat->getEmoji(),
                'description' => $cat->getDescription(),
                'status'      => $cat->getStatus(),
                'position'    => $cat->getPosition(),
            ];
        }, $cats);

        return $this->json(['items' => $items]);
    }
}
