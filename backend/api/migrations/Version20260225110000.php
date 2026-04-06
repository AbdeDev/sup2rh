<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260225110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create support_tickets table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("
            CREATE TABLE IF NOT EXISTS support_tickets (
                id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) DEFAULT NULL,
                email VARCHAR(255) NOT NULL,
                type VARCHAR(30) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'open',
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
                PRIMARY KEY(id)
            )
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DROP TABLE IF EXISTS support_tickets");
    }
}
