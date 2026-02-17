<?php

namespace App\Entity;

use App\Repository\QuizSessionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: QuizSessionRepository::class)]
#[ORM\Table(name: 'quiz_sessions')]
class QuizSession
{
    #[ORM\Id]
    #[ORM\Column(type: Types::GUID)]
    private string $id; // UUID

    #[ORM\Column(type: Types::GUID)]
    private string $userId; // UUID Supabase

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $finalJobId = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $scores = null;

    #[ORM\OneToMany(targetEntity: QuizSessionAnswer::class, mappedBy: 'session', cascade: ['persist', 'remove'])]
    private Collection $answers;

    public function __construct()
    {
        $this->answers = new ArrayCollection();
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

    public function getUserId(): string
    {
        return $this->userId;
    }

    public function setUserId(string $userId): static
    {
        $this->userId = $userId;
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

    public function getFinalJobId(): ?string
    {
        return $this->finalJobId;
    }

    public function setFinalJobId(?string $finalJobId): static
    {
        $this->finalJobId = $finalJobId;
        return $this;
    }

    public function getScores(): ?array
    {
        return $this->scores;
    }

    public function setScores(?array $scores): static
    {
        $this->scores = $scores;
        return $this;
    }

    /**
     * @return Collection<int, QuizSessionAnswer>
     */
    public function getAnswers(): Collection
    {
        return $this->answers;
    }

    public function addAnswer(QuizSessionAnswer $answer): static
    {
        if (!$this->answers->contains($answer)) {
            $this->answers->add($answer);
            $answer->setSession($this);
        }

        return $this;
    }

    public function removeAnswer(QuizSessionAnswer $answer): static
    {
        if ($this->answers->removeElement($answer)) {
            if ($answer->getSession() === $this) {
                $answer->setSession(null);
            }
        }

        return $this;
    }
}
