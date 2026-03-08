<?php

namespace App\Controller\Api;

use App\Entity\CompanyContactRequest;
use App\Repository\CompanyContactRequestRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/company-contact', name: 'api_company_contact_')]
final class CompanyContactController extends AbstractController
{
    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0F | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3F | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    /** Route publique — soumission depuis la landing page */
    #[Route('', name: 'submit', methods: ['POST'])]
    public function submit(
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        $companyName   = trim($data['companyName'] ?? '');
        $contactName   = trim($data['contactName'] ?? '');
        $email         = trim($data['email'] ?? '');
        $message       = trim($data['message'] ?? '');

        if ($companyName === '' || $contactName === '' || $email === '' || $message === '') {
            return $this->json(['message' => 'companyName, contactName, email et message sont requis'], 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['message' => 'Email invalide'], 422);
        }

        $contact = new CompanyContactRequest();
        $contact->setId(self::generateUuid());
        $contact->setCompanyName($companyName);
        $contact->setContactName($contactName);
        $contact->setEmail($email);
        $contact->setPhone(!empty($data['phone']) ? trim($data['phone']) : null);
        $contact->setMessage($message);
        $contact->setFormationInterest(!empty($data['formationInterest']) ? trim($data['formationInterest']) : null);

        $em->persist($contact);
        $em->flush();

        return $this->json(['id' => $contact->getId(), 'message' => 'Demande enregistrée'], 201);
    }

    /** Route admin — liste toutes les demandes entreprises */
    #[Route('/admin', name: 'admin_list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function adminList(CompanyContactRequestRepository $repository): JsonResponse
    {
        $items = $repository->findBy([], ['createdAt' => 'DESC']);
        return $this->json([
            'items' => array_map(fn (CompanyContactRequest $c) => [
                'id'                => $c->getId(),
                'companyName'       => $c->getCompanyName(),
                'contactName'       => $c->getContactName(),
                'email'             => $c->getEmail(),
                'phone'             => $c->getPhone(),
                'message'           => $c->getMessage(),
                'formationInterest' => $c->getFormationInterest(),
                'createdAt'         => $c->getCreatedAt()->format(DATE_ATOM),
            ], $items),
        ]);
    }
}
