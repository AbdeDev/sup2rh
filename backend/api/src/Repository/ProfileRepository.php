<?php

namespace App\Repository;

use App\Entity\Profile;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Profile>
 */
class ProfileRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Profile::class);
    }

    /** Trouve un profil par email (insensible à la casse). */
    public function findOneByEmail(string $email): ?Profile
    {
        $qb = $this->createQueryBuilder('p')
            ->where('LOWER(p.email) = LOWER(:email)')
            ->setParameter('email', trim($email))
            ->setMaxResults(1);

        return $qb->getQuery()->getOneOrNullResult();
    }
}
