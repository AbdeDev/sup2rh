<?php

namespace App\Controller\Api\Admin;

use App\Repository\ContactRequestRepository;
use App\Repository\JobRepository;
use App\Repository\QuizSessionRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
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
                    'phone' => $c->getPhone(),
                    'userId' => $userId,
                    'sessions' => [],
                    'contactRequestedAt' => $c->getCreatedAt()->format(DATE_ATOM),
                ];
            }
            if (!$byUser[$userId]['phone'] && $c->getPhone()) {
                $byUser[$userId]['phone'] = $c->getPhone();
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

    #[Route('/export', name: 'export', methods: ['GET'])]
    public function export(
        ContactRequestRepository $contactRepository,
        JobRepository $jobRepository
    ): Response {
        $contacts = $contactRepository->findBy([], ['createdAt' => 'DESC']);

        $csv = fopen('php://temp', 'r+');
        fputcsv($csv, ['ID', 'Email', 'Telephone', 'Metier recommande', 'Date']);
        foreach ($contacts as $c) {
            $jobName = '';
            if ($c->getJobId()) {
                $job = $jobRepository->find($c->getJobId());
                $jobName = $job ? $job->getName() : $c->getJobId();
            }
            fputcsv($csv, [
                $c->getId(),
                $c->getEmail(),
                $c->getPhone() ?? '',
                $jobName,
                $c->getCreatedAt()->format('Y-m-d H:i:s'),
            ]);
        }
        rewind($csv);
        $content = stream_get_contents($csv);
        fclose($csv);

        return new Response($content, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="demandes-contact.csv"',
        ]);
    }
}
