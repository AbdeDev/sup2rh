<?php

namespace App\Controller\Api\Admin;

use App\Entity\Quiz;
use App\Repository\JobRepository;
use App\Repository\QuizRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** Parcours de quiz (liés à une fiche métier RH) : CRUD admin. */
#[Route('/api/admin/quizzes', name: 'api_admin_quizzes_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminQuizController extends AbstractController
{
    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0F | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3F | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(QuizRepository $repository): JsonResponse
    {
        $quizzes = $repository->findBy([], ['createdAt' => 'DESC']);
        $items = array_map([$this, 'quizToArray'], $quizzes);
        return $this->json(['items' => $items]);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    public function get(string $id, QuizRepository $repository): JsonResponse
    {
        $quiz = $repository->find($id);
        if (!$quiz) {
            return $this->json(['message' => 'Quiz not found'], 404);
        }
        return $this->json($this->quizToArray($quiz));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request, JobRepository $jobRepository, EntityManagerInterface $em, QuizRepository $quizRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        $jobId = $data['jobId'] ?? null;
        if (!$jobId || !is_string($jobId)) {
            return $this->json(['message' => 'jobId is required'], 422);
        }
        $job = $jobRepository->find($jobId);
        if (!$job) {
            return $this->json(['message' => 'Job not found'], 422);
        }

        $name = isset($data['name']) && is_string($data['name']) ? trim($data['name']) : 'Parcours ' . $job->getName();
        if ($name === '') {
            $name = 'Parcours ' . $job->getName();
        }

        $questions = isset($data['questions']) && is_array($data['questions']) ? $data['questions'] : null;

        $quiz = new Quiz();
        $quiz->setId(self::generateUuid());
        $quiz->setName($name);
        $quiz->setJob($job);
        $quiz->setQuestions($questions);

        $em->persist($quiz);
        $em->flush();

        return $this->json($this->quizToArray($quiz), 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    public function update(string $id, Request $request, QuizRepository $repository, JobRepository $jobRepository, EntityManagerInterface $em): JsonResponse
    {
        $quiz = $repository->find($id);
        if (!$quiz) {
            return $this->json(['message' => 'Quiz not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        if (isset($data['name']) && is_string($data['name']) && trim($data['name']) !== '') {
            $quiz->setName(trim($data['name']));
        }
        if (isset($data['jobId']) && is_string($data['jobId'])) {
            $job = $jobRepository->find($data['jobId']);
            if ($job) {
                $quiz->setJob($job);
            }
        }
        if (array_key_exists('questions', $data)) {
            $quiz->setQuestions(is_array($data['questions']) ? $data['questions'] : null);
        }

        $em->flush();

        return $this->json($this->quizToArray($quiz));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    public function delete(string $id, QuizRepository $repository, EntityManagerInterface $em): JsonResponse
    {
        $quiz = $repository->find($id);
        if (!$quiz) {
            return $this->json(['message' => 'Quiz not found'], 404);
        }
        $em->remove($quiz);
        $em->flush();
        return $this->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function quizToArray(Quiz $quiz): array
    {
        return [
            'id' => $quiz->getId(),
            'jobId' => $quiz->getJob()->getId(),
            'name' => $quiz->getName(),
            'questions' => $quiz->getQuestions() ?? [],
            'createdAt' => $quiz->getCreatedAt()->format(DATE_ATOM),
        ];
    }
}
