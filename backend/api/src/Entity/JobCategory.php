<?php

namespace App\Entity;

use App\Repository\JobCategoryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Grand domaine RH (ex: "Recrutement & Acquisition de Talents").
 * Regroupe les fiches métier pour le résultat du quiz.
 */
#[ORM\Entity(repositoryClass: JobCategoryRepository::class)]
#[ORM\Table(name: 'job_categories')]
class JobCategory
{
    #[ORM\Id]
    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $id;

    /** Nom du domaine (ex: "Recrutement & Acquisition de Talents") */
    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Assert\NotBlank(message: 'Le nom du domaine est requis')]
    private string $name;

    /** Emoji représentatif (ex: "🎯") */
    #[ORM\Column(type: Types::STRING, length: 10, nullable: true)]
    private ?string $emoji = null;

    /** Description du domaine RH */
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    /** Statut : "established" ou "emerging" */
    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    private ?string $status = null;

    /** Ordre d'affichage */
    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $position = 0;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }

    public function setId(string $id): static
    {
        $this->id = $id;
        return $this;
    }

    public function getName(): string { return $this->name; }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getEmoji(): ?string { return $this->emoji; }

    public function setEmoji(?string $emoji): static
    {
        $this->emoji = $emoji;
        return $this;
    }

    public function getDescription(): ?string { return $this->description; }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getStatus(): ?string { return $this->status; }

    public function setStatus(?string $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getPosition(): int { return $this->position; }

    public function setPosition(int $position): static
    {
        $this->position = $position;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }
}
