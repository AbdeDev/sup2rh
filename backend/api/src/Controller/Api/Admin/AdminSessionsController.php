<?php

namespace App\Controller\Api\Admin;

use App\Repository\JobRepository;
use App\Repository\ProfileRepository;
use App\Repository\QuizSessionRepository;
use App\Services\AiAnalyzer;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** Liste des utilisateurs avec leurs sessions de quiz (nombre, dates, résultats) pour l'admin. */
#[Route('/api/admin/sessions', name: 'api_admin_sessions_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminSessionsController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        QuizSessionRepository $sessionRepository,
        ProfileRepository $profileRepository,
        JobRepository $jobRepository
    ): JsonResponse {
        $sessions = $sessionRepository->findBy([], ['createdAt' => 'DESC']);
        $byUser = [];

        foreach ($sessions as $session) {
            $userId = $session->getUserId();
            if (!isset($byUser[$userId])) {
                $profile = $profileRepository->find($userId);
                $byUser[$userId] = [
                    'userId' => $userId,
                    'email' => $profile?->getEmail() ?? 'Inconnu',
                    'sessionCount' => 0,
                    'sessions' => [],
                ];
            }

            $jobId = $session->getFinalJobId();
            $jobName = null;
            if ($jobId) {
                $job = $jobRepository->find($jobId);
                $jobName = $job ? $job->getName() : $jobId;
            }

            $answers = [];
            foreach ($session->getAnswers() as $a) {
                $answers[] = [
                    'questionId' => $a->getQuestionId(),
                    'answerId' => $a->getAnswerId(),
                    'textValue' => $a->getTextValue(),
                ];
            }

            $byUser[$userId]['sessionCount']++;
            $byUser[$userId]['sessions'][] = [
                'id' => $session->getId(),
                'answerCount' => $session->getAnswers()->count(),
                'finalJobId' => $jobId,
                'jobName' => $jobName,
                'scores' => $session->getScores(),
                'createdAt' => $session->getCreatedAt()->format(DATE_ATOM),
            ];
        }

        $items = array_values($byUser);
        usort($items, fn ($a, $b) => $b['sessionCount'] <=> $a['sessionCount']);

        return $this->json(['items' => $items]);
    }

    /** Détail d'une session (admin peut voir n'importe quelle session). */
    #[Route('/{id}', name: 'get', methods: ['GET'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    public function get(
        string $id,
        QuizSessionRepository $sessionRepository,
        ProfileRepository $profileRepository,
        JobRepository $jobRepository,
        AiAnalyzer $aiAnalyzer
    ): JsonResponse {
        $session = $sessionRepository->find($id);
        if (!$session) {
            return $this->json(['message' => 'Session non trouvée'], 404);
        }

        $profile = $profileRepository->find($session->getUserId());
        $answers = [];
        foreach ($session->getAnswers() as $a) {
            $answers[] = [
                'questionId' => $a->getQuestionId(),
                'answerId' => $a->getAnswerId(),
                'textValue' => $a->getTextValue(),
                'jobId' => $a->getJobId(),
                'createdAt' => $a->getCreatedAt()->format(DATE_ATOM),
            ];
        }

        $jobId = $session->getFinalJobId();
        $job = $jobId ? $jobRepository->find($jobId) : null;
        $analysis = null;

        $jobPayload = $job ? [
            'id' => $job->getId(),
            'name' => $job->getName(),
            'description' => $job->getDescription(),
            'salary' => $job->getSalary(),
            'hiringRate' => $job->getHiringRate(),
            'turnoverRate' => $job->getTurnoverRate(),
            'createdAt' => $job->getCreatedAt()->format(DATE_ATOM),
        ] : null;

        if ($jobId) {
            $cachedScores = $session->getScores();
            if ($cachedScores && !empty($cachedScores)) {
                $analysis = [
                    'jobId' => $jobId,
                    'confidence' => max($cachedScores) ?: 0.5,
                    'explanation' => $job
                        ? sprintf('Vos réponses indiquent une affinité avec le profil « %s ».', $job->getName())
                        : 'Profil analysé avec succès.',
                    'scores' => $cachedScores,
                    'job' => $jobPayload,
                ];
            } else {
                try {
                    $result = $aiAnalyzer->analyze($session);
                    $analysis = [
                        'jobId' => $result->jobId,
                        'confidence' => $result->confidence,
                        'explanation' => $result->explanation,
                        'scores' => $result->scores,
                        'job' => $jobPayload,
                    ];
                } catch (\Throwable $e) {
                    $analysis = [
                        'jobId' => $jobId,
                        'confidence' => 0.5,
                        'explanation' => 'Analyse non disponible.',
                        'scores' => [],
                        'job' => $jobPayload,
                    ];
                }
            }
        }

        return $this->json([
            'session' => [
                'id' => $session->getId(),
                'userId' => $session->getUserId(),
                'createdAt' => $session->getCreatedAt()->format(DATE_ATOM),
                'finalJobId' => $jobId,
                'scores' => $session->getScores(),
                'answers' => $answers,
            ],
            'user' => [
                'id' => $session->getUserId(),
                'email' => $profile?->getEmail() ?? 'Inconnu',
            ],
            'analysis' => $analysis,
        ]);
    }
}
