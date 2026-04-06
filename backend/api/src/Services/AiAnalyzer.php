<?php

namespace App\Services;

use App\DTO\AnalysisResult;
use App\Entity\Job;
use App\Entity\QuizSession;
use App\Repository\BrochureRepository;
use App\Repository\JobRepository;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class AiAnalyzer
{
    private HttpClientInterface $httpClient;

    public function __construct(
        private readonly JobRepository $jobRepository,
        private readonly BrochureRepository $brochureRepository,
        private readonly ?string $groqApiKey = null,
        private readonly ?string $openRouterApiKey = null,
        private readonly ?string $huggingFaceApiKey = null
    ) {
        $this->httpClient = HttpClient::create();
    }

    /**
     * Analyse hybride : scoring par regles + explication IA personnalisee.
     * 1) Les scores sont TOUJOURS calcules par les regles (fiable, deterministe)
     * 2) L'IA est appelee pour generer une explication riche et personnalisee
     */
    public function analyze(QuizSession $session): AnalysisResult
    {
        $answers = $session->getAnswers()->toArray();
        $jobs = $this->jobRepository->findBy([], ['name' => 'ASC']);

        if (empty($jobs)) {
            return new AnalysisResult(
                jobId: '',
                confidence: 0,
                explanation: "Aucune fiche metier RH disponible. Configurez des fiches depuis l'admin.",
                scores: []
            );
        }

        // Etape 1 : Scoring par regles (toujours, pour des scores fiables et deterministes)
        $rulesResult = $this->analyzeWithRules($answers, $jobs);

        // Etape 2 : Appeler l'IA pour enrichir avec une vraie explication personnalisee
        $context = $this->buildContext($answers);
        $aiExplanation = $this->getAiExplanation($context, $jobs, $rulesResult);

        if ($aiExplanation !== null) {
            return new AnalysisResult(
                jobId: $rulesResult->jobId,
                confidence: $rulesResult->confidence,
                explanation: $aiExplanation,
                scores: $rulesResult->scores
            );
        }

        return $rulesResult;
    }

    /**
     * Appelle l'IA (Groq puis OpenRouter en fallback) pour generer
     * une explication personnalisee basee sur les reponses et le metier recommande.
     */
    private function getAiExplanation(string $context, array $jobs, AnalysisResult $rulesResult): ?string
    {
        $jobName = 'Metier RH';
        foreach ($jobs as $j) {
            if ($j->getId() === $rulesResult->jobId) {
                $jobName = $j->getName();
                break;
            }
        }

        $topScores = $rulesResult->scores;
        arsort($topScores);
        $topJobs = [];
        $i = 0;
        foreach ($topScores as $jid => $score) {
            if ($i >= 3) break;
            $name = $jid;
            foreach ($jobs as $j) {
                if ($j->getId() === $jid) { $name = $j->getName(); break; }
            }
            $topJobs[] = $name . ' (' . round($score * 100) . '%)';
            $i++;
        }

        $brochureContext = $this->getBrochureContext();
        $topJobsStr = implode(', ', $topJobs);

        $prompt = <<<PROMPT
{$brochureContext}Tu es un expert en orientation vers les metiers des Ressources Humaines. Voici les reponses d'un candidat a un quiz RH :

{$context}

Le scoring algorithmique a determine que le metier le plus adapte est : **{$jobName}**
Top 3 des affinites : {$topJobsStr}

Redige une explication personnalisee de 3 a 5 phrases maximum qui :
1. Explique POURQUOI ce metier correspond au profil du candidat en se basant sur ses reponses
2. Met en avant les qualites et tendances visibles dans ses reponses (leadership, rigueur, empathie, creativite, etc.)
3. Mentionne brievement ce que ce metier implique au quotidien
4. Est encourageante et professionnelle, tutoie le candidat

Reponds UNIQUEMENT avec le texte de l'explication, sans guillemets, sans JSON, sans prefixe.
PROMPT;

        if ($this->groqApiKey !== null && $this->groqApiKey !== '') {
            $result = $this->callLlmForExplanation(
                'https://api.groq.com/openai/v1/chat/completions',
                $this->groqApiKey,
                'llama-3.3-70b-versatile',
                $prompt
            );
            if ($result !== null) return $result;
        }

        if ($this->openRouterApiKey !== null && $this->openRouterApiKey !== '') {
            $result = $this->callLlmForExplanation(
                'https://openrouter.ai/api/v1/chat/completions',
                $this->openRouterApiKey,
                'meta-llama/llama-3.1-8b-instruct:free',
                $prompt
            );
            if ($result !== null) return $result;
        }

        return null;
    }

    private function callLlmForExplanation(string $url, string $apiKey, string $model, string $prompt): ?string
    {
        try {
            $response = $this->httpClient->request('POST', $url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => $model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => "Tu es un conseiller en orientation specialise dans les metiers des Ressources Humaines. Tu analyses le profil d'un candidat et tu lui expliques pourquoi un metier RH precis lui correspond. Tu es bienveillant, professionnel et tu tutoies le candidat. Tu reponds en francais uniquement.",
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 300,
                ],
            ]);

            $data = $response->toArray();
            $content = trim($data['choices'][0]['message']['content'] ?? '');

            if (strlen($content) > 30) {
                $content = preg_replace('/^["\']+|["\']+$/', '', $content);
                return $content;
            }
        } catch (\Throwable $e) {
            // IA indisponible, on reste sur le fallback regles
        }

        return null;
    }

    private function buildContext(array $answers): string
    {
        $labels = [
            'a1' => 'Pas du tout d\'accord',
            'a2' => 'Plutot pas d\'accord',
            'a3' => 'Neutre',
            'a4' => 'Plutot d\'accord',
            'a5' => 'Tout a fait d\'accord',
        ];

        $context = "Reponses du quiz RH (echelle de 1 a 5, 1=pas d'accord, 5=d'accord):\n\n";

        foreach ($answers as $answer) {
            $raw = $answer->getTextValue() ?? $answer->getAnswerId() ?? 'N/A';
            $label = $labels[$raw] ?? $raw;
            $questionLabel = $answer->getQuestionText() ?: $answer->getQuestionId();
            $context .= sprintf(
                "- %s : %s\n",
                $questionLabel,
                $label
            );
        }

        return $context;
    }

    /** @param list<Job> $jobs */
    private function analyzeWithRules(array $answers, array $jobs): AnalysisResult
    {
        if (empty($jobs)) {
            return new AnalysisResult(jobId: '', confidence: 0, explanation: 'Aucun metier disponible.', scores: []);
        }

        $labels = ['a1' => 1, 'a2' => 2, 'a3' => 3, 'a4' => 4, 'a5' => 5];
        $validJobIds = array_flip(array_map(fn (Job $j) => $j->getId(), $jobs));

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
                explanation: 'Profil analyse ; nous vous recommandons le metier RH le plus adapte.',
                scores: array_fill_keys(array_map(fn (Job $j) => $j->getId(), $jobs), 0.5)
            );
        }

        arsort($jobScores);
        $jobId = (string) array_key_first($jobScores);
        $confidence = $jobScores[$jobId] ?? 0.7;
        $jobName = 'Metier RH';
        foreach ($jobs as $j) {
            if ($j->getId() === $jobId) {
                $jobName = $j->getName();
                break;
            }
        }

        return new AnalysisResult(
            jobId: $jobId,
            confidence: $confidence,
            explanation: sprintf('Tes reponses indiquent une affinite avec le profil %s. Ce metier correspond a ta sensibilite et ton approche des ressources humaines.', $jobName),
            scores: $jobScores
        );
    }

    private function getBrochureContext(): string
    {
        $brochures = $this->brochureRepository->findAll();
        if (empty($brochures)) {
            return '';
        }
        $parts = ["Voici des informations sur les formations SUP des RH (utilise ce contexte pour personnaliser ton analyse) :\n"];
        foreach ($brochures as $b) {
            $parts[] = "### " . $b->getName() . "\n" . $b->getContent();
        }
        return implode("\n\n", $parts) . "\n\n---\n\n";
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
        $brochureContext = $this->getBrochureContext();

        return <<<PROMPT
{$brochureContext}Analyse les reponses suivantes d'un quiz strictement RH (domaine des ressources humaines uniquement) et recommande le metier RH le plus adapte parmi la liste ci-dessous.

{$context}

Reponds UNIQUEMENT au format JSON suivant (sans texte avant ou apres), avec jobId egal a l'un des identifiants listes :
{
  "jobId": "<un des id ci-dessous>",
  "confidence": 0.85,
  "explanation": "Explication courte et professionnelle (domaine RH uniquement)",
  "scores": { "id1": 0.85, "id2": 0.60, ... }
}

Metiers RH disponibles (tu DOIS choisir parmi ceux-ci) :
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
                        explanation: is_string($data['explanation'] ?? null) ? $data['explanation'] : 'Analyse effectuee.',
                        scores: $scores
                    );
                }
            }
        }

        return $this->analyzeWithRules($answers, $jobs);
    }
}
