<?php

namespace App\Controller\Api;

use App\Entity\QuizSession;
use App\Repository\QuizSessionRepository;
use App\Security\AuthUser;
use App\Services\AiAnalyzer;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/quiz/session/{sessionId}/analyze', name: 'api_quiz_analyze_')]
final class QuizAnalyzeController extends AbstractController
{
    #[Route('', name: 'analyze', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function analyze(
        string $sessionId,
        QuizSessionRepository $sessionRepository,
        AiAnalyzer $aiAnalyzer,
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

        // Vérifier qu'il y a des réponses
        if ($session->getAnswers()->isEmpty()) {
            return $this->json(['message' => 'No answers found for this session'], 422);
        }

        // Analyser avec l'IA
        $analysisResult = $aiAnalyzer->analyze($session);

        // Sauvegarder le résultat dans la session
        $session->setFinalJobId($analysisResult->jobId);
        $session->setScores($analysisResult->scores);

        $em->flush();

        return $this->json([
            'jobId' => $analysisResult->jobId,
            'confidence' => $analysisResult->confidence,
            'explanation' => $analysisResult->explanation,
            'scores' => $analysisResult->scores,
        ], 200);
    }
}
