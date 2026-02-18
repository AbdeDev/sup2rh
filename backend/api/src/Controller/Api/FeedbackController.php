<?php

namespace App\Controller\Api;

use App\Entity\Feedback;
use App\Repository\FeedbackRepository;
use App\Security\AuthUser;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/feedback', name: 'api_feedback_')]
final class FeedbackController extends AbstractController
{
    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0F | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3F | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    #[Route('', name: 'submit', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function submit(
        Request $request,
        FeedbackRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var AuthUser $user */
        $user = $this->getUser();
        $email = $user->email ?? '';

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Invalid JSON'], 400);
        }

        if ($email === '' && !empty($data['email']) && is_string($data['email'])) {
            $email = trim($data['email']);
        }
        if ($email === '') {
            return $this->json(['message' => 'Email requis'], 422);
        }

        $message = $data['message'] ?? '';
        if (!is_string($message) || trim($message) === '') {
            return $this->json(['message' => 'Message requis'], 422);
        }

        $rating = null;
        if (isset($data['rating']) && is_numeric($data['rating'])) {
            $r = (int) $data['rating'];
            if ($r >= 1 && $r <= 5) {
                $rating = $r;
            }
        }

        $feedback = new Feedback();
        $feedback->setId(self::generateUuid());
        $feedback->setEmail($email);
        $feedback->setUserId($user->getUserIdentifier());
        $feedback->setMessage(trim($message));
        $feedback->setRating($rating);

        $em->persist($feedback);
        $em->flush();

        return $this->json([
            'id' => $feedback->getId(),
            'message' => 'Avis enregistré, merci !',
        ], 201);
    }
}
