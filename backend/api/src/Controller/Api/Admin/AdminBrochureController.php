<?php

namespace App\Controller\Api\Admin;

use App\Entity\Brochure;
use App\Repository\BrochureRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/brochures', name: 'api_admin_brochures_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminBrochureController extends AbstractController
{
    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0F | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3F | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(BrochureRepository $repo): JsonResponse
    {
        $items = $repo->findBy([], ['createdAt' => 'DESC']);
        $data = array_map(fn(Brochure $b) => [
            'id' => $b->getId(),
            'name' => $b->getName(),
            'content' => $b->getContent(),
            'createdAt' => $b->getCreatedAt()->format(\DATE_ATOM),
        ], $items);

        return $this->json(['items' => $data]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        $name = trim($data['name'] ?? '');
        $content = trim($data['content'] ?? '');
        if ($name === '' || $content === '') {
            return $this->json(['message' => 'Nom et contenu requis'], 422);
        }

        $brochure = new Brochure();
        $brochure->setId(self::generateUuid());
        $brochure->setName($name);
        $brochure->setContent($content);

        $em->persist($brochure);
        $em->flush();

        return $this->json([
            'id' => $brochure->getId(),
            'name' => $brochure->getName(),
            'content' => $brochure->getContent(),
            'createdAt' => $brochure->getCreatedAt()->format(\DATE_ATOM),
        ], 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(string $id, Request $request, BrochureRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        $brochure = $repo->find($id);
        if (!$brochure) {
            return $this->json(['message' => 'Brochure introuvable'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        if (isset($data['name']) && trim($data['name']) !== '') {
            $brochure->setName(trim($data['name']));
        }
        if (isset($data['content']) && trim($data['content']) !== '') {
            $brochure->setContent(trim($data['content']));
        }

        $em->flush();

        return $this->json([
            'id' => $brochure->getId(),
            'name' => $brochure->getName(),
            'content' => $brochure->getContent(),
            'createdAt' => $brochure->getCreatedAt()->format(\DATE_ATOM),
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id, BrochureRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        $brochure = $repo->find($id);
        if (!$brochure) {
            return $this->json(['message' => 'Brochure introuvable'], 404);
        }

        $em->remove($brochure);
        $em->flush();

        return $this->json(['message' => 'Brochure supprimée']);
    }
}
