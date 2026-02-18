<?php

namespace App\Controller\Api;

use App\Repository\QuizRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Quiz : 15 questions aléatoires parmi toutes les questions de toutes les fiches.
 * Si moins de 15 questions, retourne toutes. Répartition égale sur 3 pages.
 */
#[Route('/api/quiz', name: 'api_quiz_')]
final class QuizController extends AbstractController
{
    private const TARGET_QUESTIONS = 15;
    private const PAGES = 3;

    #[Route('/questions', name: 'questions', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function questions(QuizRepository $quizRepository): JsonResponse
    {
        try {
            $quizzes = $quizRepository->findAll();
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Erreur chargement questions : ' . $e->getMessage()], 500);
        }
        $allQuestions = [];

        $allQuestions = [];
        foreach ($quizzes as $quiz) {
            $jobId = $quiz->getJob()->getId();
            $questions = $quiz->getQuestions();
            if (!is_array($questions)) {
                continue;
            }
            foreach ($questions as $q) {
                if (!isset($q['text']) || $q['text'] === '') {
                    continue;
                }
                $allQuestions[] = [
                    'id' => $q['id'] ?? '',
                    'text' => $q['text'],
                    'answers' => $q['answers'] ?? [],
                    'jobId' => $jobId,
                ];
            }
        }

        $seen = [];
        $unique = [];
        $idx = 0;
        foreach ($allQuestions as $q) {
            $key = $q['text'];
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $idx++;
                $unique[] = [
                    'id' => 'q' . $idx,
                    'text' => $q['text'],
                    'answers' => $q['answers'],
                    'jobId' => $q['jobId'] ?? null,
                ];
            }
        }

        shuffle($unique);

        $selected = count($unique) >= self::TARGET_QUESTIONS
            ? array_slice($unique, 0, self::TARGET_QUESTIONS)
            : $unique;

        $questionsPerPage = count($selected) > 0
            ? (int) ceil(count($selected) / self::PAGES)
            : 5;

        return $this->json([
            'questions' => $selected,
            'questionsPerPage' => $questionsPerPage,
        ]);
    }
}
