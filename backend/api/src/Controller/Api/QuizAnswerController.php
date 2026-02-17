<?php

namespace App\Controller\Api;

use App\Entity\QuizSession;
use App\Entity\QuizSessionAnswer;
use App\Repository\QuizSessionRepository;
use App\Security\AuthUser;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Uid\Uuid;

#[Route('/api/quiz/session/{sessionId}/answer', name: 'api_quiz_answer_')]
final class QuizAnswerController extends AbstractController
{
    #[Route('', name: 'submit', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function submit(
        string $sessionId,
        Request $request,
        QuizSessionRepository $sessionRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var AuthUser $user */
        $user = $this->getUser();
        $userId = $user->getUserIdentifier();

        // Récupérer la session
        $session = $sessionRepository->find($sessionId);

        if (!$session) {
            return $this->json(['message' => 'Session not found'], 404);
        }

        // Vérifier que la session appartient à l'utilisateur
        if ($session->getUserId() !== $userId) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        // Parser la requête
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        $questionId = $data['questionId'] ?? null;
        $answerId = $data['answerId'] ?? null;
        $textValue = $data['textValue'] ?? null;

        if (!$questionId) {
            return $this->json(['message' => 'questionId is required'], 422);
        }

        if (!$answerId && !$textValue) {
            return $this->json(['message' => 'answerId or textValue is required'], 422);
        }

        // Vérifier si une réponse existe déjà pour cette question
        $existingAnswer = null;
        foreach ($session->getAnswers() as $answer) {
            if ($answer->getQuestionId() === $questionId) {
                $existingAnswer = $answer;
                break;
            }
        }

        if ($existingAnswer) {
            // Mettre à jour la réponse existante
            $existingAnswer->setAnswerId($answerId);
            $existingAnswer->setTextValue($textValue);
        } else {
            // Créer une nouvelle réponse
            $answer = new QuizSessionAnswer();
            $answer->setId(Uuid::v4()->toRfc4122());
            $answer->setSession($session);
            $answer->setQuestionId($questionId);
            $answer->setAnswerId($answerId);
            $answer->setTextValue($textValue);

            $em->persist($answer);
        }

        $em->flush();

        $savedAnswer = $existingAnswer ?? $answer;

        return $this->json([
            'id' => $savedAnswer->getId(),
            'questionId' => $savedAnswer->getQuestionId(),
            'answerId' => $savedAnswer->getAnswerId(),
            'textValue' => $savedAnswer->getTextValue(),
            'createdAt' => $savedAnswer->getCreatedAt()->format(DATE_ATOM),
        ], 201);
    }
}
