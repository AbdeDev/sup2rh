<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260225100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add phone column to contact_requests table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS phone VARCHAR(30) DEFAULT NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE contact_requests DROP COLUMN IF EXISTS phone");
    }
}
