<?php

namespace App\Controller\Api\Admin;

use App\Entity\Feedback;
use App\Repository\FeedbackRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/feedbacks', name: 'api_admin_feedbacks_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminFeedbackController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(FeedbackRepository $repository): JsonResponse
    {
        $feedbacks = $repository->findBy([], ['createdAt' => 'DESC']);
        $items = array_map(fn (Feedback $f) => [
            'id' => $f->getId(),
            'email' => $f->getEmail(),
            'userId' => $f->getUserId(),
            'message' => $f->getMessage(),
            'rating' => $f->getRating(),
            'createdAt' => $f->getCreatedAt()->format(DATE_ATOM),
        ], $feedbacks);

        return $this->json(['items' => $items]);
    }
}
