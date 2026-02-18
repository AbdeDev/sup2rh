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

#[Route('/api/quiz/session/{sessionId}/answer', name: 'api_quiz_answer_')]
final class QuizAnswerController extends AbstractController
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
        $jobId = isset($data['jobId']) && is_string($data['jobId']) ? $data['jobId'] : null;
        $questionText = isset($data['questionText']) && is_string($data['questionText']) ? trim($data['questionText']) : null;

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
            $existingAnswer->setAnswerId($answerId);
            $existingAnswer->setTextValue($textValue);
            if ($jobId !== null) {
                $existingAnswer->setJobId($jobId);
            }
            if ($questionText !== null) {
                $existingAnswer->setQuestionText($questionText);
            }
        } else {
            $answer = new QuizSessionAnswer();
            $answer->setId(self::generateUuid());
            $answer->setSession($session);
            $answer->setQuestionId($questionId);
            $answer->setAnswerId($answerId);
            $answer->setTextValue($textValue);
            $answer->setJobId($jobId);
            $answer->setQuestionText($questionText);

            $em->persist($answer);
        }

        try {
            $em->flush();
        } catch (\Throwable $e) {
            return $this->json([
                'message' => 'Erreur lors de l\'enregistrement : ' . $e->getMessage(),
            ], 500);
        }

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
