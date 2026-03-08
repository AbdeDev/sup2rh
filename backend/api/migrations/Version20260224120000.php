<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260224120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add category column to jobs table for HR sub-theme grouping';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE jobs DROP COLUMN IF EXISTS category");
    }
}
