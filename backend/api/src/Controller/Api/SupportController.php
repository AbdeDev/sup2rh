<?php

namespace App\Controller\Api;

use App\Entity\SupportTicket;
use App\Security\AuthUser;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/support', name: 'api_support_')]
final class SupportController extends AbstractController
{
    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0F | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3F | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    #[Route('', name: 'submit', methods: ['POST'])]
    public function submit(
        Request $request,
        EntityManagerInterface $em,
        MailerInterface $mailer
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        $type = $data['type'] ?? '';
        if (!in_array($type, ['support', 'feature_request'], true)) {
            return $this->json(['message' => 'Type invalide (support ou feature_request)'], 422);
        }

        $email = trim($data['email'] ?? '');
        $subject = trim($data['subject'] ?? '');
        $message = trim($data['message'] ?? '');

        if ($email === '' || $subject === '' || $message === '') {
            return $this->json(['message' => 'Email, sujet et message sont requis'], 422);
        }

        /** @var AuthUser|null $user */
        $user = $this->getUser();

        $ticket = new SupportTicket();
        $ticket->setId(self::generateUuid());
        $ticket->setUserId($user?->getUserIdentifier());
        $ticket->setEmail($email);
        $ticket->setType($type);
        $ticket->setSubject($subject);
        $ticket->setMessage($message);

        $em->persist($ticket);
        $em->flush();

        $supportEmail = $_ENV['SUPPORT_EMAIL'] ?? null;
        if ($supportEmail) {
            try {
                $typeLabel = $type === 'feature_request' ? 'Suggestion' : 'Demande d\'aide';
                $mail = (new Email())
                    ->from('noreply@rhetmoi.fr')
                    ->to($supportEmail)
                    ->replyTo($email)
                    ->subject("[RH&MOI] {$typeLabel} : {$subject}")
                    ->text("De : {$email}\nType : {$typeLabel}\n\n{$message}");
                $mailer->send($mail);
            } catch (\Throwable) {
                // Mail non bloquant
            }
        }

        return $this->json([
            'id' => $ticket->getId(),
            'message' => 'Ticket créé avec succès',
        ], 201);
    }
}
