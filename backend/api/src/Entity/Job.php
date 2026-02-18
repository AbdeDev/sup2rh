<?php

namespace App\Entity;

use App\Repository\JobRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Fiche métier RH : métier, description, fiche de poste (salaire, taux d'embauche,
 * turnover, indicateurs France), vidéo explicative.
 */
#[ORM\Entity(repositoryClass: JobRepository::class)]
#[ORM\Table(name: 'jobs')]
class Job
{
    #[ORM\Id]
    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $id;

    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Assert\NotBlank(message: 'Le nom du métier est requis')]
    #[Assert\Length(min: 1, max: 255)]
    private string $name;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    /** Salaire (ex: "35-45k€", "40 000 €") */
    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $salary = null;

    /** Taux d'embauche (indicateur France) */
    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $hiringRate = null;

    /** Taux de turnover (indicateur France) */
    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $turnoverRate = null;

    /** Autres indicateurs (JSON, ex: évolution, pénurie, etc.) */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $indicators = null;

    /** URL de la vidéo explicative du métier */
    #[ORM\Column(type: Types::STRING, length: 1024, nullable: true)]
    private ?string $videoUrl = null;

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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getSalary(): ?string
    {
        return $this->salary;
    }

    public function setSalary(?string $salary): static
    {
        $this->salary = $salary;
        return $this;
    }

    public function getHiringRate(): ?float
    {
        return $this->hiringRate;
    }

    public function setHiringRate(?float $hiringRate): static
    {
        $this->hiringRate = $hiringRate;
        return $this;
    }

    public function getTurnoverRate(): ?float
    {
        return $this->turnoverRate;
    }

    public function setTurnoverRate(?float $turnoverRate): static
    {
        $this->turnoverRate = $turnoverRate;
        return $this;
    }

    public function getIndicators(): ?array
    {
        return $this->indicators;
    }

    public function setIndicators(?array $indicators): static
    {
        $this->indicators = $indicators;
        return $this;
    }

    public function getVideoUrl(): ?string
    {
        return $this->videoUrl;
    }

    public function setVideoUrl(?string $videoUrl): static
    {
        $this->videoUrl = $videoUrl;
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
