<?php

namespace App\Services;

use App\DTO\AnalysisResult;
use App\Entity\Job;
use App\Entity\QuizSession;
use App\Repository\JobRepository;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class AiAnalyzer
{
    private HttpClientInterface $httpClient;

    /** Ordre de priorité : Groq (gratuit, puissant) → OpenRouter (gratuit) → HuggingFace → règles */
    public function __construct(
        private readonly JobRepository $jobRepository,
        private readonly ?string $groqApiKey = null,
        private readonly ?string $openRouterApiKey = null,
        private readonly ?string $huggingFaceApiKey = null
    ) {
        $this->httpClient = HttpClient::create();
    }

    /**
     * Analyse les réponses d'une session de quiz et retourne le métier RH (fiche en BDD) le plus adapté.
     * Les questions et réponses sont strictement cantonnées au domaine RH.
     */
    public function analyze(QuizSession $session): AnalysisResult
    {
        $answers = $session->getAnswers()->toArray();
        $jobs = $this->jobRepository->findBy([], ['name' => 'ASC']);

        if (empty($jobs)) {
            return new AnalysisResult(
                jobId: '',
                confidence: 0,
                explanation: 'Aucune fiche métier RH disponible. Configurez des fiches depuis l’admin.',
                scores: []
            );
        }

        // Priorité : utiliser la table quiz_session_answers où chaque réponse
        // est liée à une question elle-même liée à une fiche (jobId).
        // Si on a des réponses avec jobId, le scoring par règles est le plus fiable.
        $hasJobLinkedAnswers = $this->hasJobLinkedAnswers($answers);
        if ($hasJobLinkedAnswers) {
            return $this->analyzeWithRules($answers, $jobs);
        }

        $context = $this->buildContext($answers);

        if ($this->groqApiKey !== null && $this->groqApiKey !== '') {
            return $this->analyzeWithGroq($context, $jobs, $answers);
        }

        if ($this->openRouterApiKey !== null && $this->openRouterApiKey !== '') {
            return $this->analyzeWithOpenRouter($context, $jobs, $answers);
        }

        if ($this->huggingFaceApiKey !== null && $this->huggingFaceApiKey !== '') {
            return $this->analyzeWithHuggingFace($context, $jobs, $answers);
        }

        return $this->analyzeWithRules($answers, $jobs);
    }

    /** Vérifie si des réponses ont un jobId (lien question → fiche métier). */
    private function hasJobLinkedAnswers(array $answers): bool
    {
        foreach ($answers as $a) {
            if ($a->getJobId() !== null && $a->getJobId() !== '') {
                return true;
            }
        }
        return false;
    }

    private function buildContext(array $answers): string
    {
        $labels = [
            'a1' => 'Pas du tout d\'accord',
            'a2' => 'Plutôt pas d\'accord',
            'a3' => 'Neutre',
            'a4' => 'Plutôt d\'accord',
            'a5' => 'Tout à fait d\'accord',
        ];

        $context = "Réponses du quiz RH (échelle de 1 à 5, 1=pas d'accord, 5=d'accord):\n\n";

        foreach ($answers as $answer) {
            $raw = $answer->getTextValue() ?? $answer->getAnswerId() ?? 'N/A';
            $label = $labels[$raw] ?? $raw;
            $questionLabel = $answer->getQuestionText() ?: $answer->getQuestionId();
            $context .= sprintf(
                "- %s → %s\n",
                $questionLabel,
                $label
            );
        }

        return $context;
    }

    /**
     * Groq : gratuit, sans CB, très rapide. Modèles Llama 3 (ex. 70B).
     * Clé : https://console.groq.com
     *
     * @param list<Job> $jobs
     */
    private function analyzeWithGroq(string $context, array $jobs, array $answers): AnalysisResult
    {
        $prompt = $this->buildPrompt($context, $jobs);

        try {
            $response = $this->httpClient->request('POST', 'https://api.groq.com/openai/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->groqApiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Tu es un expert en ressources humaines. Tu analyses UNIQUEMENT des réponses à un quiz strictement cantonné au domaine RH (recrutement, formation, rémunération, droit du travail, QVT, GPEC, etc.). Tu recommandes le métier RH (parmi la liste fournie) le plus cohérent avec le profil. Tu réponds UNIQUEMENT au format JSON demandé, avec jobId égal à l’un des identifiants de la liste.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.5,
                ],
            ]);

            $data = $response->toArray();
            $content = $data['choices'][0]['message']['content'] ?? '';

            return $this->parseAiResponse($content, $jobs, $answers);
        } catch (\Throwable $e) {
            return $this->analyzeWithRules($answers, $jobs);
        }
    }

    /** @param list<Job> $jobs */
    private function analyzeWithOpenRouter(string $context, array $jobs, array $answers): AnalysisResult
    {
        $prompt = $this->buildPrompt($context, $jobs);

        try {
            $response = $this->httpClient->request('POST', 'https://openrouter.ai/api/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->openRouterApiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'meta-llama/llama-3.1-8b-instruct:free',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Tu es un expert en ressources humaines. Tu analyses UNIQUEMENT des réponses à un quiz strictement cantonné au domaine RH (recrutement, formation, rémunération, droit du travail, QVT, GPEC, etc.). Tu recommandes le métier RH (parmi la liste fournie) le plus cohérent avec le profil. Tu réponds UNIQUEMENT au format JSON demandé, avec jobId égal à l’un des identifiants de la liste.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.5,
                ],
            ]);

            $data = $response->toArray();
            $content = $data['choices'][0]['message']['content'] ?? '';

            return $this->parseAiResponse($content, $jobs, $answers);
        } catch (\Throwable $e) {
            return $this->analyzeWithRules($answers, $jobs);
        }
    }

    /** @param list<Job> $jobs */
    private function analyzeWithHuggingFace(string $context, array $jobs, array $answers): AnalysisResult
    {
        return $this->analyzeWithRules($answers, $jobs);
    }

    /** @param list<Job> $jobs */
    private function analyzeWithRules(array $answers, array $jobs): AnalysisResult
    {
        if (empty($jobs)) {
            return new AnalysisResult(jobId: '', confidence: 0, explanation: 'Aucun métier disponible.', scores: []);
        }

        $labels = ['a1' => 1, 'a2' => 2, 'a3' => 3, 'a4' => 4, 'a5' => 5];
        $validJobIds = array_flip(array_map(fn (Job $j) => $j->getId(), $jobs));

        // Grouper les réponses par jobId (chaque question est liée à une fiche métier)
        $answersByJob = [];
        $answersWithoutJob = [];
        foreach ($answers as $a) {
            $jobId = $a->getJobId();
            $v = $a->getTextValue() ?? $a->getAnswerId() ?? '';
            $value = isset($labels[$v]) ? $labels[$v] : null;
            if ($value === null) {
                continue;
            }
            if ($jobId !== null && isset($validJobIds[$jobId])) {
                $answersByJob[$jobId][] = $value;
            } else {
                $answersWithoutJob[] = $value;
            }
        }

        $jobScores = [];
        $hasJobLinkedAnswers = !empty($answersByJob);

        foreach ($jobs as $job) {
            $jobId = $job->getId();
            if ($hasJobLinkedAnswers && isset($answersByJob[$jobId]) && count($answersByJob[$jobId]) > 0) {
                $avg = array_sum($answersByJob[$jobId]) / count($answersByJob[$jobId]);
                $jobScores[$jobId] = min(0.95, max(0.25, 0.2 + ($avg - 1) / 4 * 0.7));
            } else {
                if (count($answersWithoutJob) > 0) {
                    $avg = array_sum($answersWithoutJob) / count($answersWithoutJob);
                    $base = 0.2 + ($avg - 1) / 4 * 0.6;
                } else {
                    $base = 0.5;
                }
                $jobScores[$jobId] = min(0.95, max(0.25, $base));
            }
        }

        if (empty($jobScores)) {
            $first = $jobs[0];
            return new AnalysisResult(
                jobId: $first->getId(),
                confidence: 0.65,
                explanation: 'Profil analysé ; nous vous recommandons le métier RH le plus adapté.',
                scores: array_fill_keys(array_map(fn (Job $j) => $j->getId(), $jobs), 0.5)
            );
        }

        arsort($jobScores);
        $jobId = (string) array_key_first($jobScores);
        $confidence = $jobScores[$jobId] ?? 0.7;
        $jobName = 'Métier RH';
        foreach ($jobs as $j) {
            if ($j->getId() === $jobId) {
                $jobName = $j->getName();
                break;
            }
        }

        return new AnalysisResult(
            jobId: $jobId,
            confidence: $confidence,
            explanation: sprintf('Vos réponses indiquent une affinité avec le profil « %s ».', $jobName),
            scores: $jobScores
        );
    }

    /** @param list<Job> $jobs */
    private function buildPrompt(string $context, array $jobs): string
    {
        $list = [];
        foreach ($jobs as $job) {
            $list[] = '- ' . $job->getId() . ' : ' . $job->getName();
        }
        $jobsList = implode("\n", $list);
        $validIds = implode(', ', array_map(fn (Job $j) => '"' . $j->getId() . '"', $jobs));

        return <<<PROMPT
Analyse les réponses suivantes d'un quiz strictement RH (domaine des ressources humaines uniquement) et recommande le métier RH le plus adapté parmi la liste ci-dessous.

{$context}

Réponds UNIQUEMENT au format JSON suivant (sans texte avant ou après), avec jobId égal à l'un des identifiants listés :
{
  "jobId": "<un des id ci-dessous>",
  "confidence": 0.85,
  "explanation": "Explication courte et professionnelle (domaine RH uniquement)",
  "scores": { "id1": 0.85, "id2": 0.60, ... }
}

Métiers RH disponibles (tu DOIS choisir parmi ceux-ci) :
{$jobsList}

Identifiants valides : {$validIds}
PROMPT;
    }

    /** @param list<Job> $jobs */
    private function parseAiResponse(string $content, array $jobs, array $answers): AnalysisResult
    {
        $validIds = array_flip(array_map(fn (Job $j) => $j->getId(), $jobs));

        $jsonMatch = [];
        if (preg_match('/\{[\s\S]*\}/', $content, $jsonMatch)) {
            $data = json_decode($jsonMatch[0], true);
            if (is_array($data)) {
                $jobId = $data['jobId'] ?? '';
                if (isset($validIds[$jobId])) {
                    $scores = is_array($data['scores'] ?? null) ? $data['scores'] : [];
                    foreach ($jobs as $j) {
                        $id = $j->getId();
                        if (!isset($scores[$id]) || !is_numeric($scores[$id])) {
                            $scores[$id] = $id === $jobId ? 0.7 : 0.3;
                        }
                    }
                    $confidence = (float) ($data['confidence'] ?? 0.75);
                    if ($confidence <= 0 || $confidence > 1) {
                        $confidence = $scores[$jobId] ?? 0.75;
                    }
                    return new AnalysisResult(
                        jobId: $jobId,
                        confidence: $confidence,
                        explanation: is_string($data['explanation'] ?? null) ? $data['explanation'] : 'Analyse effectuée.',
                        scores: $scores
                    );
                }
            }
        }

        return $this->analyzeWithRules($answers, $jobs);
    }
}
