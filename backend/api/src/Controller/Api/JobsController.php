<?php

namespace App\Controller\Api;

use App\Entity\Job;
use App\Repository\JobRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/jobs', name: 'api_jobs_')]
final class JobsController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(JobRepository $repository): JsonResponse
    {
        $jobs = $repository->findBy([], ['name' => 'ASC']);
        $items = array_map([$this, 'jobToArray'], $jobs);
        return $this->json(['items' => $items]);
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
            'category' => $job->getCategory(),
            'createdAt' => $job->getCreatedAt()->format(DATE_ATOM),
        ];
    }
}
