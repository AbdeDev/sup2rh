<?php

namespace App\Controller\Api;

use App\Entity\Job;
use App\Entity\QuizSession;
use App\Repository\JobRepository;
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
        JobRepository $jobRepository,
        AiAnalyzer $aiAnalyzer,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var AuthUser $user */
        $user = $this->getUser();
        $userId = $user->getUserIdentifier();

        $session = $sessionRepository->find($sessionId);

        if (!$session) {
            return $this->json(['message' => 'Session not found'], 404);
        }

        if ($session->getUserId() !== $userId) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        if ($session->getAnswers()->isEmpty()) {
            return $this->json(['message' => 'No answers found for this session'], 422);
        }

        try {
            $analysisResult = $aiAnalyzer->analyze($session);
        } catch (\Throwable $e) {
            return $this->json([
                'message' => 'Erreur d\'analyse : ' . $e->getMessage(),
            ], 500);
        }

        $session->setFinalJobId($analysisResult->jobId ?: null);
        $session->setScores($analysisResult->scores);

        $em->flush();

        $payload = [
            'jobId' => $analysisResult->jobId,
            'confidence' => $analysisResult->confidence,
            'explanation' => $analysisResult->explanation,
            'scores' => $analysisResult->scores,
        ];

        if ($analysisResult->jobId !== '') {
            $job = $jobRepository->find($analysisResult->jobId);
            if ($job instanceof Job) {
                $payload['job'] = $this->jobToArray($job);
            }
        }

        return $this->json($payload, 200);
    }

    /** @return array<string, mixed> */
    private function jobToArray(Job $job): array
    {
        return [
            'id' => $job->getId(),
            'name' => $job->getName(),
            'description' => $job->getDescription(),
            'salary' => $job->getSalary(),
            'hiringRate' => $job->getHiringRate(),
            'turnoverRate' => $job->getTurnoverRate(),
            'indicators' => $job->getIndicators(),
            'videoUrl' => $job->getVideoUrl(),
            'createdAt' => $job->getCreatedAt()->format(DATE_ATOM),
        ];
    }
}
