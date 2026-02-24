<?php

namespace App\Controller\Api\Admin;

use App\Entity\Job;
use App\Repository\JobRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** Fiches métier RH : CRUD réservé aux admins. */
#[Route('/api/admin/jobs', name: 'api_admin_jobs_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminJobController extends AbstractController
{
    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0F | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3F | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(JobRepository $repository): JsonResponse
    {
        $jobs = $repository->findBy([], ['createdAt' => 'DESC']);
        $items = array_map([$this, 'jobToArray'], $jobs);
        return $this->json(['items' => $items]);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'], requirements: ['id' => '[a-zA-Z0-9_-]+'])]
    public function get(string $id, JobRepository $repository): JsonResponse
    {
        $job = $repository->find($id);
        if (!$job) {
            return $this->json(['message' => 'Job not found'], 404);
        }
        return $this->json($this->jobToArray($job));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, JobRepository $repository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        $id = $data['id'] ?? null;
        if (!$id || !is_string($id)) {
            $id = self::generateUuid();
        }

        if ($repository->find($id)) {
            return $this->json(['message' => 'Job with this id already exists'], 422);
        }

        $name = $data['name'] ?? null;
        if (!$name || !is_string($name)) {
            return $this->json(['message' => 'name is required'], 422);
        }

        $job = new Job();
        $job->setId($id);
        $job->setName($name);
        $job->setDescription(isset($data['description']) && is_string($data['description']) ? $data['description'] : null);
        $job->setSalary(isset($data['salary']) && is_string($data['salary']) ? $data['salary'] : null);
        $job->setHiringRate(isset($data['hiringRate']) ? (float) $data['hiringRate'] : null);
        $job->setTurnoverRate(isset($data['turnoverRate']) ? (float) $data['turnoverRate'] : null);
        $job->setIndicators(self::normalizeIndicators($data['indicators'] ?? null));
        $job->setVideoUrl(isset($data['videoUrl']) && is_string($data['videoUrl']) ? $data['videoUrl'] : null);

        $em->persist($job);
        $em->flush();

        return $this->json($this->jobToArray($job), 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '[a-zA-Z0-9_-]+'])]
    public function update(string $id, Request $request, JobRepository $repository, EntityManagerInterface $em): JsonResponse
    {
        $job = $repository->find($id);
        if (!$job) {
            return $this->json(['message' => 'Job not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        if (isset($data['name']) && is_string($data['name'])) {
            $job->setName($data['name']);
        }
        if (array_key_exists('description', $data)) {
            $job->setDescription(is_string($data['description']) ? $data['description'] : null);
        }
        if (array_key_exists('salary', $data)) {
            $job->setSalary(is_string($data['salary']) ? $data['salary'] : null);
        }
        if (array_key_exists('hiringRate', $data)) {
            $job->setHiringRate($data['hiringRate'] !== null ? (float) $data['hiringRate'] : null);
        }
        if (array_key_exists('turnoverRate', $data)) {
            $job->setTurnoverRate($data['turnoverRate'] !== null ? (float) $data['turnoverRate'] : null);
        }
        if (array_key_exists('indicators', $data)) {
            $job->setIndicators(self::normalizeIndicators($data['indicators']));
        }
        if (array_key_exists('videoUrl', $data)) {
            $job->setVideoUrl(is_string($data['videoUrl']) ? $data['videoUrl'] : null);
        }

        $em->flush();
        return $this->json($this->jobToArray($job));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '[a-zA-Z0-9_-]+'])]
    public function delete(string $id, JobRepository $repository, EntityManagerInterface $em): JsonResponse
    {
        $job = $repository->find($id);
        if (!$job) {
            return $this->json(['message' => 'Job not found'], 404);
        }
        $em->remove($job);
        $em->flush();
        return $this->json(null, 204);
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

    /**
     * Normalise les indicateurs : tableau de { label, value } (texte ou chiffre).
     * Accepte aussi un objet clé/valeur legacy.
     *
     * @return list<array{label: string, value: string|float}>|null
     */
    private static function normalizeIndicators(mixed $raw): ?array
    {
        if ($raw === null || $raw === []) {
            return null;
        }
        if (!is_array($raw)) {
            return null;
        }
        $out = [];
        foreach ($raw as $k => $v) {
            if (isset($v['label'], $v['value'])) {
                $label = (string) $v['label'];
                $val = $v['value'];
                $out[] = [
                    'label' => $label,
                    'value' => is_numeric($val) ? (float) $val : (string) $val,
                ];
            } elseif (is_string($k) && (is_scalar($v) || $v === null)) {
                $out[] = [
                    'label' => $k,
                    'value' => $v === null ? '' : (is_numeric($v) ? (float) $v : (string) $v),
                ];
            }
        }

        return $out ?: null;
    }
}
