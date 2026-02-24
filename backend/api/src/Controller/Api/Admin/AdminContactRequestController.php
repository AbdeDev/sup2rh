<?php

namespace App\Controller\Api\Admin;

use App\Repository\ContactRequestRepository;
use App\Repository\JobRepository;
use App\Repository\QuizSessionRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/contact-requests', name: 'api_admin_contact_requests_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminContactRequestController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        ContactRequestRepository $contactRepository,
        QuizSessionRepository $sessionRepository,
        JobRepository $jobRepository
    ): JsonResponse {
        $contacts = $contactRepository->findBy([], ['createdAt' => 'DESC']);
        $byUser = [];

        foreach ($contacts as $c) {
            $userId = $c->getUserId();
            if (!isset($byUser[$userId])) {
                $byUser[$userId] = [
                    'email' => $c->getEmail(),
                    'userId' => $userId,
                    'sessions' => [],
                    'contactRequestedAt' => $c->getCreatedAt()->format(DATE_ATOM),
                ];
            }
        }

        foreach (array_keys($byUser) as $userId) {
            $sessions = $sessionRepository->findBy(
                ['userId' => $userId],
                ['createdAt' => 'DESC']
            );
            foreach ($sessions as $session) {
                $answers = [];
                foreach ($session->getAnswers() as $a) {
                    $answers[] = [
                        'questionId' => $a->getQuestionId(),
                        'answerId' => $a->getAnswerId(),
                        'textValue' => $a->getTextValue(),
                    ];
                }
                $jobId = $session->getFinalJobId();
                $jobName = null;
                if ($jobId) {
                    $job = $jobRepository->find($jobId);
                    $jobName = $job ? $job->getName() : $jobId;
                }
                $byUser[$userId]['sessions'][] = [
                    'id' => $session->getId(),
                    'answerCount' => $session->getAnswers()->count(),
                    'answers' => $answers,
                    'finalJobId' => $jobId,
                    'jobName' => $jobName,
                    'scores' => $session->getScores(),
                    'createdAt' => $session->getCreatedAt()->format(DATE_ATOM),
                ];
            }
        }

        $items = array_values($byUser);
        return $this->json(['items' => $items]);
    }
}
