<?php

namespace App\Entity;

use App\Repository\QuizSessionAnswerRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: QuizSessionAnswerRepository::class)]
#[ORM\Table(name: 'quiz_session_answers')]
class QuizSessionAnswer
{
    #[ORM\Id]
    #[ORM\Column(type: Types::GUID)]
    private string $id; // UUID

    #[ORM\ManyToOne(targetEntity: QuizSession::class, inversedBy: 'answers')]
    #[ORM\JoinColumn(name: 'session_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private QuizSession $session;

    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $questionId;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $answerId = null;

    /** ID de la fiche métier à laquelle la question est liée (depuis le quiz) */
    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $jobId = null;

    /** Texte de la question (pour l'analyse IA) */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $questionText = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $textValue = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function setId(string $id): static
    {
        $this->id = $id;
        return $this;
    }

    public function getSession(): QuizSession
    {
        return $this->session;
    }

    public function setSession(QuizSession $session): static
    {
        $this->session = $session;
        return $this;
    }

    public function getQuestionId(): string
    {
        return $this->questionId;
    }

    public function setQuestionId(string $questionId): static
    {
        $this->questionId = $questionId;
        return $this;
    }

    public function getAnswerId(): ?string
    {
        return $this->answerId;
    }

    public function setAnswerId(?string $answerId): static
    {
        $this->answerId = $answerId;
        return $this;
    }

    public function getJobId(): ?string
    {
        return $this->jobId;
    }

    public function setJobId(?string $jobId): static
    {
        $this->jobId = $jobId;
        return $this;
    }

    public function getQuestionText(): ?string
    {
        return $this->questionText;
    }

    public function setQuestionText(?string $questionText): static
    {
        $this->questionText = $questionText;
        return $this;
    }

    public function getTextValue(): ?string
    {
        return $this->textValue;
    }

    public function setTextValue(?string $textValue): static
    {
        $this->textValue = $textValue;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }
}
