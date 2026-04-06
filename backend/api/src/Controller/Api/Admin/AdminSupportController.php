<?php

namespace App\Controller\Api\Admin;

use App\Repository\SupportTicketRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/support', name: 'api_admin_support_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminSupportController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(SupportTicketRepository $repo): JsonResponse
    {
        $tickets = $repo->findBy([], ['createdAt' => 'DESC']);
        $data = array_map(fn($t) => [
            'id' => $t->getId(),
            'userId' => $t->getUserId(),
            'email' => $t->getEmail(),
            'type' => $t->getType(),
            'subject' => $t->getSubject(),
            'message' => $t->getMessage(),
            'status' => $t->getStatus(),
            'createdAt' => $t->getCreatedAt()->format(\DATE_ATOM),
        ], $tickets);

        return $this->json(['items' => $data]);
    }

    #[Route('/{id}/status', name: 'update_status', methods: ['PUT'])]
    public function updateStatus(
        string $id,
        Request $request,
        SupportTicketRepository $repo,
        EntityManagerInterface $em
    ): JsonResponse {
        $ticket = $repo->find($id);
        if (!$ticket) {
            return $this->json(['message' => 'Ticket introuvable'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $status = $data['status'] ?? '';
        if (!in_array($status, ['open', 'in_progress', 'closed'], true)) {
            return $this->json(['message' => 'Statut invalide'], 422);
        }

        $ticket->setStatus($status);
        $em->flush();

        return $this->json(['message' => 'Statut mis à jour', 'status' => $status]);
    }
}
