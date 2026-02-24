<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260218110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create contact_requests table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE IF NOT EXISTS contact_requests (
            id VARCHAR(36) NOT NULL,
            email VARCHAR(255) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            session_id VARCHAR(36) NOT NULL,
            job_id VARCHAR(255) DEFAULT NULL,
            explanation TEXT DEFAULT NULL,
            scores JSON DEFAULT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests (email)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_contact_requests_created ON contact_requests (created_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS contact_requests');
    }
}
