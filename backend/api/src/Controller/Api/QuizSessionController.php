<?php

namespace App\Controller\Api;

use App\Entity\QuizSession;
use App\Repository\QuizSessionRepository;
use App\Security\AuthUser;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/quiz/session', name: 'api_quiz_session_')]
final class QuizSessionController extends AbstractController
{
    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0F | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3F | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(
        EntityManagerInterface $em,
        QuizSessionRepository $repository
    ): JsonResponse {
        try {
            /** @var AuthUser $user */
            $user = $this->getUser();
            $userId = $user->getUserIdentifier();

            // Créer une nouvelle session
            $session = new QuizSession();
            $session->setId(self::generateUuid());
            $session->setUserId($userId);

            $em->persist($session);
            $em->flush();

            return $this->json([
                'id' => $session->getId(),
                'userId' => $session->getUserId(),
                'createdAt' => $session->getCreatedAt()->format(DATE_ATOM),
                'finalJobId' => $session->getFinalJobId(),
                'scores' => $session->getScores(),
            ], 201);
        } catch (\Throwable $e) {
            return $this->json([
                'message' => 'Erreur lors de la création de la session: ' . $e->getMessage(),
            ], 500);
        }
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(QuizSessionRepository $repository): JsonResponse
    {
        /** @var AuthUser $user */
        $user = $this->getUser();
        $userId = $user->getUserIdentifier();

        $sessions = $repository->findBy(
            ['userId' => $userId],
            ['createdAt' => 'DESC']
        );

        $items = array_map(function (QuizSession $session) {
            return [
                'id' => $session->getId(),
                'userId' => $session->getUserId(),
                'createdAt' => $session->getCreatedAt()->format(DATE_ATOM),
                'finalJobId' => $session->getFinalJobId(),
                'scores' => $session->getScores(),
                'answerCount' => $session->getAnswers()->count(),
            ];
        }, $sessions);

        return $this->json(['items' => $items]);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function get(string $id, QuizSessionRepository $repository): JsonResponse
    {
        /** @var AuthUser $user */
        $user = $this->getUser();
        $userId = $user->getUserIdentifier();

        $session = $repository->find($id);

        if (!$session) {
            return $this->json(['message' => 'Session not found'], 404);
        }

        // Vérifier que la session appartient à l'utilisateur
        if ($session->getUserId() !== $userId) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $answers = [];
        foreach ($session->getAnswers() as $answer) {
            $answers[] = [
                'id' => $answer->getId(),
                'questionId' => $answer->getQuestionId(),
                'answerId' => $answer->getAnswerId(),
                'textValue' => $answer->getTextValue(),
                'jobId' => $answer->getJobId(),
                'createdAt' => $answer->getCreatedAt()->format(DATE_ATOM),
            ];
        }

        return $this->json([
            'id' => $session->getId(),
            'userId' => $session->getUserId(),
            'createdAt' => $session->getCreatedAt()->format(DATE_ATOM),
            'finalJobId' => $session->getFinalJobId(),
            'scores' => $session->getScores(),
            'answers' => $answers,
        ]);
    }
}
