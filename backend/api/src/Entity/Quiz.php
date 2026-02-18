<?php

namespace App\Entity;

use App\Repository\QuizRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Parcours de quiz : lié à une fiche métier RH (Job).
 * Les questions peuvent être fixées (JSON) ou générées par l’IA (15 questions, domaine RH).
 */
#[ORM\Entity(repositoryClass: QuizRepository::class)]
#[ORM\Table(name: 'quizzes')]
class Quiz
{
    #[ORM\Id]
    #[ORM\Column(type: Types::GUID)]
    private string $id;

    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Assert\NotBlank(message: 'Le nom du quiz est requis')]
    #[Assert\Length(min: 1, max: 255)]
    private string $name;

    #[ORM\ManyToOne(targetEntity: Job::class)]
    #[ORM\JoinColumn(name: 'job_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Job $job;

    /** @var list<array{id: string, text: string, answers: list<array{id: string, label: string}>}> */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $questions = null;

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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getJob(): Job
    {
        return $this->job;
    }

    public function setJob(Job $job): static
    {
        $this->job = $job;
        return $this;
    }

    /** @return list<array{id: string, text: string, answers: list<array{id: string, label: string}>}>|null */
    public function getQuestions(): ?array
    {
        return $this->questions;
    }

    /** @param list<array{id: string, text: string, answers: list<array{id: string, label: string}>}>|null $questions */
    public function setQuestions(?array $questions): static
    {
        $this->questions = $questions;
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
