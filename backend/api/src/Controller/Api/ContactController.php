<?php

namespace App\Controller\Api;

use App\Entity\ContactRequest;
use App\Repository\ContactRequestRepository;
use App\Repository\QuizSessionRepository;
use App\Security\AuthUser;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/contact', name: 'api_contact_')]
final class ContactController extends AbstractController
{
    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0F | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3F | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    #[Route('', name: 'submit', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function submit(
        Request $request,
        QuizSessionRepository $sessionRepository,
        ContactRequestRepository $contactRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var AuthUser $user */
        $user = $this->getUser();
        $userId = $user->getUserIdentifier();
        $email = $user->email ?? '';

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        if ($email === '' && !empty($data['email']) && is_string($data['email'])) {
            $email = trim($data['email']);
        }
        if ($email === '') {
            return $this->json(['message' => 'Email requis pour la demande de contact'], 422);
        }

        $sessionId = $data['sessionId'] ?? null;
        if (!$sessionId || !is_string($sessionId)) {
            return $this->json(['message' => 'sessionId is required'], 422);
        }

        $session = $sessionRepository->find($sessionId);
        if (!$session) {
            return $this->json(['message' => 'Session not found'], 404);
        }
        if ($session->getUserId() !== $userId) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        if ($contactRepository->findOneBy(['sessionId' => $sessionId])) {
            return $this->json(['message' => 'Une demande existe déjà pour cette session'], 422);
        }

        $contact = new ContactRequest();
        $contact->setId(self::generateUuid());
        $contact->setEmail($email);
        $contact->setUserId($userId);
        $contact->setSessionId($sessionId);
        $contact->setJobId($data['jobId'] ?? $session->getFinalJobId());
        $contact->setExplanation($data['explanation'] ?? null);
        $contact->setScores($data['scores'] ?? $session->getScores());

        $em->persist($contact);
        $em->flush();

        return $this->json([
            'id' => $contact->getId(),
            'message' => 'Demande de contact enregistrée',
        ], 201);
    }
}
