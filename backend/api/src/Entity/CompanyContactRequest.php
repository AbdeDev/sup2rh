<?php

namespace App\Entity;

use App\Repository\CompanyContactRequestRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CompanyContactRequestRepository::class)]
#[ORM\Table(name: 'company_contact_requests')]
class CompanyContactRequest
{
    #[ORM\Id]
    #[ORM\Column(type: Types::STRING, length: 36)]
    private string $id;

    /** Raison sociale / nom de l'entreprise */
    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $companyName;

    /** Nom du contact côté entreprise */
    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $contactName;

    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $email;

    #[ORM\Column(type: Types::STRING, length: 30, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(type: Types::TEXT)]
    private string $message;

    /** Formation(s) concernée(s) (texte libre) */
    #[ORM\Column(type: Types::STRING, length: 500, nullable: true)]
    private ?string $formationInterest = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }
    public function setId(string $id): static { $this->id = $id; return $this; }

    public function getCompanyName(): string { return $this->companyName; }
    public function setCompanyName(string $companyName): static { $this->companyName = $companyName; return $this; }

    public function getContactName(): string { return $this->contactName; }
    public function setContactName(string $contactName): static { $this->contactName = $contactName; return $this; }

    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $phone): static { $this->phone = $phone; return $this; }

    public function getMessage(): string { return $this->message; }
    public function setMessage(string $message): static { $this->message = $message; return $this; }

    public function getFormationInterest(): ?string { return $this->formationInterest; }
    public function setFormationInterest(?string $formationInterest): static { $this->formationInterest = $formationInterest; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
}
