<?php

namespace App\Controller\Api\Admin;

use App\Repository\CompanyContactRequestRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/company-contacts', name: 'api_admin_company_contacts_')]
#[IsGranted('ROLE_ADMIN')]
final class AdminCompanyContactController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(CompanyContactRequestRepository $repo): JsonResponse
    {
        $items = $repo->findBy([], ['createdAt' => 'DESC']);
        $data = array_map(fn($c) => [
            'id' => $c->getId(),
            'companyName' => $c->getCompanyName(),
            'contactName' => $c->getContactName(),
            'email' => $c->getEmail(),
            'phone' => $c->getPhone(),
            'message' => $c->getMessage(),
            'formationInterest' => $c->getFormationInterest(),
            'createdAt' => $c->getCreatedAt()->format(\DATE_ATOM),
        ], $items);

        return $this->json(['items' => $data]);
    }

    #[Route('/export', name: 'export', methods: ['GET'])]
    public function export(CompanyContactRequestRepository $repo): Response
    {
        $items = $repo->findBy([], ['createdAt' => 'DESC']);

        $csv = fopen('php://temp', 'r+');
        fputcsv($csv, ['ID', 'Entreprise', 'Contact', 'Email', 'Telephone', 'Message', 'Formation', 'Date']);
        foreach ($items as $c) {
            fputcsv($csv, [
                $c->getId(),
                $c->getCompanyName(),
                $c->getContactName(),
                $c->getEmail(),
                $c->getPhone() ?? '',
                $c->getMessage(),
                $c->getFormationInterest() ?? '',
                $c->getCreatedAt()->format('Y-m-d H:i:s'),
            ]);
        }
        rewind($csv);
        $content = stream_get_contents($csv);
        fclose($csv);

        return new Response($content, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="demandes-entreprises.csv"',
        ]);
    }
}
