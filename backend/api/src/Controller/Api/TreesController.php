<?php

namespace App\Controller\Api;

use App\Entity\Tree;
use App\Repository\TreeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/trees', name: 'api_trees_')]
final class TreesController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(TreeRepository $repo): JsonResponse
    {
        $trees = $repo->findBy([], ['id' => 'DESC']);

        $items = array_map(fn (Tree $t) => [
            'id' => $t->getId(),
            'name' => $t->getName(),
            'createdAt' => $t->getCreatedAt()->format(DATE_ATOM),
        ], $trees);

        return new JsonResponse(['items' => $items]);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'])]
    public function get(int $id, TreeRepository $repo): JsonResponse
    {
        $tree = $repo->find($id);

        if (!$tree) {
            return new JsonResponse(['message' => 'Tree not found'], 404);
        }

        return new JsonResponse([
            'id' => $tree->getId(),
            'name' => $tree->getName(),
            'createdAt' => $tree->getCreatedAt()->format(DATE_ATOM),
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $name = is_array($data) ? ($data['name'] ?? null) : null;

        if (!is_string($name) || trim($name) === '') {
            return new JsonResponse(['message' => 'name is required'], 422);
        }

        $tree = new Tree();
        $tree->setName(trim($name));

        $em->persist($tree);
        $em->flush();

        return new JsonResponse([
            'id' => $tree->getId(),
            'name' => $tree->getName(),
            'createdAt' => $tree->getCreatedAt()->format(DATE_ATOM),
        ], 201);
    }
}
