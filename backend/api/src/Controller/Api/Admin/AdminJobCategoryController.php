<?php

namespace App\Controller\Api\Admin;

use App\Entity\JobCategory;
use App\Repository\JobCategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** Grands domaines RH : CRUD réservé aux admins. */
#[Route('/api/admin/job-categories', name: 'api_admin_job_categories_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminJobCategoryController extends AbstractController
{
    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0F | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3F | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(JobCategoryRepository $repo): JsonResponse
    {
        $cats = $repo->findBy([], ['position' => 'ASC', 'name' => 'ASC']);
        return $this->json(['items' => array_map([$this, 'toArray'], $cats)]);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'])]
    public function get(string $id, JobCategoryRepository $repo): JsonResponse
    {
        $cat = $repo->find($id);
        if (!$cat) {
            return $this->json(['message' => 'Domaine introuvable'], 404);
        }
        return $this->json($this->toArray($cat));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, JobCategoryRepository $repo): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'JSON invalide'], 400);
        }

        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            return $this->json(['message' => 'Le nom est requis'], 422);
        }

        $id = $data['id'] ?? null;
        if (!$id || !is_string($id)) {
            $id = self::generateUuid();
        }

        if ($repo->find($id)) {
            return $this->json(['message' => 'Un domaine avec cet id existe déjà'], 422);
        }

        $cat = new JobCategory();
        $cat->setId($id);
        $cat->setName($name);
        $cat->setEmoji(isset($data['emoji']) ? (string) $data['emoji'] : null);
        $cat->setDescription(isset($data['description']) ? (string) $data['description'] : null);
        $cat->setStatus(isset($data['status']) ? (string) $data['status'] : null);
        $cat->setPosition(isset($data['position']) ? (int) $data['position'] : 0);

        $em->persist($cat);
        $em->flush();

        return $this->json($this->toArray($cat), 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(string $id, Request $request, EntityManagerInterface $em, JobCategoryRepository $repo): JsonResponse
    {
        $cat = $repo->find($id);
        if (!$cat) {
            return $this->json(['message' => 'Domaine introuvable'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'JSON invalide'], 400);
        }

        if (array_key_exists('name', $data)) {
            $name = trim((string) $data['name']);
            if ($name === '') {
                return $this->json(['message' => 'Le nom ne peut pas être vide'], 422);
            }
            $cat->setName($name);
        }

        if (array_key_exists('emoji', $data)) {
            $cat->setEmoji($data['emoji'] !== null ? (string) $data['emoji'] : null);
        }
        if (array_key_exists('description', $data)) {
            $cat->setDescription($data['description'] !== null ? (string) $data['description'] : null);
        }
        if (array_key_exists('status', $data)) {
            $cat->setStatus($data['status'] !== null ? (string) $data['status'] : null);
        }
        if (array_key_exists('position', $data)) {
            $cat->setPosition((int) $data['position']);
        }

        $em->flush();

        return $this->json($this->toArray($cat));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id, EntityManagerInterface $em, JobCategoryRepository $repo): JsonResponse
    {
        $cat = $repo->find($id);
        if (!$cat) {
            return $this->json(['message' => 'Domaine introuvable'], 404);
        }

        $em->remove($cat);
        $em->flush();

        return $this->json(null, 204);
    }

    private function toArray(JobCategory $cat): array
    {
        return [
            'id'          => $cat->getId(),
            'name'        => $cat->getName(),
            'emoji'       => $cat->getEmoji(),
            'description' => $cat->getDescription(),
            'status'      => $cat->getStatus(),
            'position'    => $cat->getPosition(),
            'createdAt'   => $cat->getCreatedAt()->format(\DATE_ATOM),
        ];
    }
}
