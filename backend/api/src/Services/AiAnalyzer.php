<?php

namespace App\Services;

use App\DTO\AnalysisResult;
use App\Entity\QuizSession;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class AiAnalyzer
{
    private HttpClientInterface $httpClient;

    public function __construct(
        private readonly ?string $openRouterApiKey = null,
        private readonly ?string $huggingFaceApiKey = null
    ) {
        $this->httpClient = HttpClient::create();
    }

    /**
     * Analyse les réponses d'une session de quiz et retourne une recommandation de métier
     */
    public function analyze(QuizSession $session): AnalysisResult
    {
        // Récupérer toutes les réponses de la session
        $answers = $session->getAnswers()->toArray();
        
        // Préparer le contexte pour l'IA
        $context = $this->buildContext($answers);

        // Appeler l'IA (OpenRouter en priorité, sinon HuggingFace)
        if ($this->openRouterApiKey) {
            return $this->analyzeWithOpenRouter($context);
        }

        if ($this->huggingFaceApiKey) {
            return $this->analyzeWithHuggingFace($context);
        }

        // Fallback : analyse simple basée sur des règles
        return $this->analyzeWithRules($answers);
    }

    private function buildContext(array $answers): string
    {
        $context = "Réponses du quiz RH:\n\n";
        
        foreach ($answers as $answer) {
            $context .= sprintf(
                "Question: %s\nRéponse: %s\n\n",
                $answer->getQuestionId(),
                $answer->getTextValue() ?? $answer->getAnswerId() ?? 'N/A'
            );
        }

        return $context;
    }

    private function analyzeWithOpenRouter(string $context): AnalysisResult
    {
        $prompt = $this->buildPrompt($context);

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
                            'content' => 'Tu es un expert en ressources humaines qui analyse les réponses d\'un quiz pour recommander le métier RH le plus adapté.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.7,
                ],
            ]);

            $data = $response->toArray();
            $content = $data['choices'][0]['message']['content'] ?? '';

            return $this->parseAiResponse($content);
        } catch (\Exception $e) {
            // En cas d'erreur, utiliser l'analyse par règles
            return $this->analyzeWithRules([]);
        }
    }

    private function analyzeWithHuggingFace(string $context): AnalysisResult
    {
        // Implémentation HuggingFace si nécessaire
        // Pour l'instant, fallback sur règles
        return $this->analyzeWithRules([]);
    }

    private function analyzeWithRules(array $answers): AnalysisResult
    {
        // Analyse simple basée sur les réponses
        // Mapping des métiers RH communs
        $jobs = [
            'hr-business-partner' => [
                'name' => 'HR Business Partner',
                'description' => 'Vous accompagnez les managers dans leur gestion RH quotidienne.',
            ],
            'recruiter' => [
                'name' => 'Recruteur',
                'description' => 'Vous êtes spécialisé dans le recrutement et la sélection de talents.',
            ],
            'hr-analyst' => [
                'name' => 'Analyste RH',
                'description' => 'Vous analysez les données RH pour prendre des décisions stratégiques.',
            ],
            'training-manager' => [
                'name' => 'Responsable Formation',
                'description' => 'Vous développez les compétences des collaborateurs.',
            ],
            'compensation-benefits' => [
                'name' => 'Spécialiste Rémunération',
                'description' => 'Vous gérez les politiques de rémunération et avantages.',
            ],
        ];

        // Logique simple : analyser les réponses pour déterminer le métier
        // Par défaut, recommander HR Business Partner
        $recommendedJob = 'hr-business-partner';
        $confidence = 0.75;
        $explanation = 'Basé sur vos réponses, nous recommandons le métier de HR Business Partner.';

        // Analyser les réponses pour affiner la recommandation
        foreach ($answers as $answer) {
            $questionId = $answer->getQuestionId();
            $answerValue = $answer->getTextValue() ?? $answer->getAnswerId() ?? '';

            // Logique de mapping simple
            if (str_contains(strtolower($questionId), 'recrutement') || str_contains(strtolower($answerValue), 'recrut')) {
                $recommendedJob = 'recruiter';
                $confidence = 0.80;
                $explanation = 'Vos réponses montrent un intérêt pour le recrutement.';
                break;
            }

            if (str_contains(strtolower($questionId), 'données') || str_contains(strtolower($answerValue), 'analys')) {
                $recommendedJob = 'hr-analyst';
                $confidence = 0.78;
                $explanation = 'Vous semblez intéressé par l\'analyse de données RH.';
                break;
            }
        }

        return new AnalysisResult(
            jobId: $recommendedJob,
            confidence: $confidence,
            explanation: $explanation,
            scores: []
        );
    }

    private function buildPrompt(string $context): string
    {
        return <<<PROMPT
Analyse les réponses suivantes d'un quiz RH et recommande le métier RH le plus adapté.

{$context}

Réponds au format JSON suivant :
{
  "jobId": "hr-business-partner",
  "confidence": 0.85,
  "explanation": "Explication détaillée de la recommandation",
  "scores": {
    "hr-business-partner": 0.85,
    "recruiter": 0.60,
    "hr-analyst": 0.45
  }
}

Métiers RH disponibles :
- hr-business-partner : HR Business Partner
- recruiter : Recruteur
- hr-analyst : Analyste RH
- training-manager : Responsable Formation
- compensation-benefits : Spécialiste Rémunération
PROMPT;
    }

    private function parseAiResponse(string $content): AnalysisResult
    {
        // Essayer d'extraire le JSON de la réponse
        $jsonMatch = [];
        if (preg_match('/\{[^}]+\}/s', $content, $jsonMatch)) {
            $data = json_decode($jsonMatch[0], true);
            if ($data) {
                return new AnalysisResult(
                    jobId: $data['jobId'] ?? 'hr-business-partner',
                    confidence: (float) ($data['confidence'] ?? 0.75),
                    explanation: $data['explanation'] ?? 'Analyse effectuée par IA',
                    scores: $data['scores'] ?? []
                );
            }
        }

        // Fallback si le parsing échoue
        return $this->analyzeWithRules([]);
    }
}
