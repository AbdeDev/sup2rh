<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260218120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create feedbacks table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE IF NOT EXISTS feedbacks (
            id VARCHAR(36) NOT NULL,
            email VARCHAR(255) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_feedbacks_email ON feedbacks (email)');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_feedbacks_created ON feedbacks (created_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS feedbacks');
    }
}
